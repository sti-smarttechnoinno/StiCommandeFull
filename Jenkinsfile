pipeline {
    agent any

    triggers {
        // Poll SCM every 2 minutes or trigger on GitHub webhook push
        pollSCM('H/2 * * * *')
        githubPush()
    }

    options {
        timeout(time: 40, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
        timestamps()
        // Prevents overlapping builds from colliding on fixed test ports (5433, 8099, 3099)
        disableConcurrentBuilds()
    }

    environment {
        PHP_VERSION      = '8.5'
        IMAGE_BACKEND    = 'sticommande-backend'
        IMAGE_FRONTEND   = 'sticommande-frontend'
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
        DEPLOY_PATH      = '/var/www/commande'

        // Baked into the frontend bundle at build time. "/api" and "/ws" are
        // relative paths served through the nginx gateway on the same origin
        // as the frontend — override if the gateway doesn't proxy /ws yet.
        NEXT_PUBLIC_API_URL = "${env.NEXT_PUBLIC_API_URL ?: '/api'}"
        NEXT_PUBLIC_WS_URL  = "${env.NEXT_PUBLIC_WS_URL ?: '/ws'}"

        // Ephemeral test database (Test Backend stage only)
        TEST_DB_NAME     = 'sticommande_test'
        TEST_DB_USER     = 'postgres'
        TEST_DB_PASS     = 'secret_test_pass'
        TEST_DB_PORT     = '5433'
        TEST_APP_KEY     = 'base64:Sm9obkRvZUlzQUZha2VLZXlGb3JUZXN0aW5nMTIzNDU='
    }

    stages {
        stage('Checkout') {
            steps {
                echo "--> Checking out project repository..."
                checkout scm
            }
        }

        stage('Test Backend') {
            steps {
                echo "--> Running backend test suite against ephemeral PostgreSQL..."
                sh '''
                    TEST_PG_CONTAINER="pg_test_${BUILD_NUMBER}"
                    docker rm -f "$TEST_PG_CONTAINER" || true

                    docker run -d --name "$TEST_PG_CONTAINER" \
                        -e POSTGRES_DB=${TEST_DB_NAME} \
                        -e POSTGRES_USER=${TEST_DB_USER} \
                        -e POSTGRES_PASSWORD=${TEST_DB_PASS} \
                        -p ${TEST_DB_PORT}:5432 \
                        docker.io/library/postgres:16-alpine

                    for i in $(seq 1 20); do
                        if docker exec "$TEST_PG_CONTAINER" pg_isready -U ${TEST_DB_USER} -d ${TEST_DB_NAME} >/dev/null 2>&1; then
                            echo "PostgreSQL test container ready!"
                            break
                        fi
                        sleep 1
                    done

                    cd backend

                    # Test env vars — explicit so results don't depend on an untracked .env.testing
                    export APP_KEY="${TEST_APP_KEY}"
                    export DB_CONNECTION=pgsql
                    export DB_HOST=127.0.0.1
                    export DB_PORT=${TEST_DB_PORT}
                    export DB_DATABASE=${TEST_DB_NAME}
                    export DB_USERNAME=${TEST_DB_USER}
                    export DB_PASSWORD=${TEST_DB_PASS}

                    mkdir -p public/build && echo '{}' > public/build/manifest.json

                    if command -v php${PHP_VERSION} >/dev/null 2>&1 && php${PHP_VERSION} -m | grep -qi pdo_pgsql; then
                        php${PHP_VERSION} artisan test --env=testing
                    elif command -v php >/dev/null 2>&1 && php -m | grep -qi pdo_pgsql; then
                        php artisan test --env=testing
                    else
                        docker run --rm \
                            --network host \
                            -e APP_KEY="${TEST_APP_KEY}" \
                            -e DB_CONNECTION=pgsql \
                            -e DB_HOST=127.0.0.1 \
                            -e DB_PORT=${TEST_DB_PORT} \
                            -e DB_DATABASE=${TEST_DB_NAME} \
                            -e DB_USERNAME=${TEST_DB_USER} \
                            -e DB_PASSWORD=${TEST_DB_PASS} \
                            -v "$(pwd):/app" -w /app \
                            docker.io/library/php:${PHP_VERSION}-alpine sh -c "
                                apk add --no-cache curl postgresql-dev icu-dev libzip-dev
                                docker-php-ext-install pdo pdo_pgsql intl zip
                                curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
                                composer install --prefer-dist --no-interaction
                                php artisan test --env=testing
                            "
                    fi
                '''
            }
            post {
                always {
                    sh '''
                        TEST_PG_CONTAINER="pg_test_${BUILD_NUMBER}"
                        docker rm -f "$TEST_PG_CONTAINER" || true
                        rm -f backend/bootstrap/cache/*.php || true
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "--> Building production Docker images for Backend & Frontend..."
                echo "--> NEXT_PUBLIC_API_URL=${env.NEXT_PUBLIC_API_URL}"
                echo "--> NEXT_PUBLIC_WS_URL=${env.NEXT_PUBLIC_WS_URL}"
                sh '''
                    # 1. Build Backend Image (includes the websocket-server.js hub, run via Supervisor)
                    echo "--> Building Backend (PHP ${PHP_VERSION})..."
                    docker build \
                        --build-arg PHP_VERSION=${PHP_VERSION} \
                        -t ${IMAGE_BACKEND}:${IMAGE_TAG} \
                        -t ${IMAGE_BACKEND}:latest \
                        -f backend/Dockerfile backend/

                    # 2. Build Next.js Frontend Image
                    echo "--> Building Frontend (Next.js)..."
                    docker build \
                        --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
                        --build-arg NEXT_PUBLIC_WS_URL="${NEXT_PUBLIC_WS_URL}" \
                        -t ${IMAGE_FRONTEND}:${IMAGE_TAG} \
                        -t ${IMAGE_FRONTEND}:latest \
                        -f frontend/Dockerfile frontend/
                '''
            }
        }

        stage('Smoke Tests (Healthcheck)') {
            steps {
                echo "--> Running smoke tests on backend and frontend containers..."
                sh '''
                    SMOKE_BACKEND="smoke_backend_${BUILD_NUMBER}"
                    SMOKE_FRONTEND="smoke_frontend_${BUILD_NUMBER}"

                    docker rm -f "$SMOKE_BACKEND" "$SMOKE_FRONTEND" >/dev/null 2>&1 || true

                    # Test Backend
                    docker run -d --name "$SMOKE_BACKEND" \
                        -e APP_ENV=testing \
                        -e APP_KEY=${TEST_APP_KEY} \
                        -e DB_CONNECTION=sqlite \
                        -e DB_DATABASE=:memory: \
                        -e CACHE_STORE=array \
                        -e SESSION_DRIVER=array \
                        -e QUEUE_CONNECTION=sync \
                        -e RUN_MIGRATIONS=false \
                        -e START_WEBSOCKET=false \
                        -e START_QUEUE_WORKER=false \
                        -p 127.0.0.1:8099:80 \
                        ${IMAGE_BACKEND}:${IMAGE_TAG}

                    # Test Frontend
                    docker run -d --name "$SMOKE_FRONTEND" \
                        -p 127.0.0.1:3099:3000 \
                        ${IMAGE_FRONTEND}:${IMAGE_TAG}

                    # Verify Backend /up
                    BACKEND_READY=false
                    for i in $(seq 1 30); do
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8099/up 2>/dev/null || true)
                        if [ "$STATUS" = "200" ]; then
                            BACKEND_READY=true
                            echo "Backend healthcheck passed after ${i}s!"
                            break
                        fi
                        sleep 1
                    done

                    # Verify Frontend /
                    FRONTEND_READY=false
                    for i in $(seq 1 30); do
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3099/ 2>/dev/null || true)
                        if [ "$STATUS" = "200" ] || [ "$STATUS" = "304" ]; then
                            FRONTEND_READY=true
                            echo "Frontend healthcheck passed after ${i}s!"
                            break
                        fi
                        sleep 1
                    done

                    # Cleanup smoke containers
                    docker rm -f "$SMOKE_BACKEND" "$SMOKE_FRONTEND" >/dev/null 2>&1 || true

                    if [ "$BACKEND_READY" != "true" ] || [ "$FRONTEND_READY" != "true" ]; then
                        echo "ERROR: One or more smoke tests failed!"
                        exit 1
                    fi
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo "--> Deploying full application stack via Docker Compose..."
                sh '''
                    SUDO=""
                    if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
                        SUDO="sudo -n"
                    fi

                    TARGET_DIR="${DEPLOY_PATH}"
                    CAN_USE_DEPLOY_PATH=false

                    if [ -d "$TARGET_DIR" ] && [ -w "$TARGET_DIR" ]; then
                        CAN_USE_DEPLOY_PATH=true
                    elif mkdir -p "$TARGET_DIR" 2>/dev/null; then
                        CAN_USE_DEPLOY_PATH=true
                    elif [ -n "$SUDO" ] && $SUDO mkdir -p "$TARGET_DIR" 2>/dev/null; then
                        $SUDO chown -R $(whoami): "$TARGET_DIR" 2>/dev/null || true
                        CAN_USE_DEPLOY_PATH=true
                    fi

                    if [ "$CAN_USE_DEPLOY_PATH" = "true" ]; then
                        echo "--> Synchronizing configuration and compose files to $TARGET_DIR..."
                        rsync -av --delete \
                            --no-owner \
                            --no-group \
                            --no-perms \
                            --exclude=".git" \
                            --exclude="node_modules" \
                            --exclude="vendor" \
                            --exclude="backend/storage" \
                            --exclude="backend/vendor" \
                            --exclude="frontend/node_modules" \
                            --exclude="frontend/.next" \
                            ./ "$TARGET_DIR"/

                        # Ensure persistent .env exists on server
                        if [ ! -f "$TARGET_DIR/.env" ] && [ -f ".env" ]; then
                            cp .env "$TARGET_DIR/.env"
                        fi
                    else
                        echo "Notice: Cannot write to $TARGET_DIR. Deploying directly from workspace: $(pwd)"
                        TARGET_DIR="$(pwd)"
                    fi

                    echo "--> Starting containers with Docker Compose in $TARGET_DIR..."
                    cd "$TARGET_DIR"
                    docker compose down --remove-orphans || true
                    docker compose up -d
                    docker compose ps

                    echo "--> Verifying gateway health on http://127.0.0.1/up..."
                    for i in $(seq 1 20); do
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/up 2>/dev/null || true)
                        if [ "$STATUS" = "200" ]; then
                            echo "SUCCESS: Gateway and services are healthy!"
                            break
                        fi
                        sleep 1
                    done
                '''
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
        success {
            echo "SUCCESS: StiCommande Full Stack deployment completed successfully."
        }
        failure {
            echo "FAILURE: StiCommande Full Stack pipeline failed. Check stage logs above."
        }
    }
}