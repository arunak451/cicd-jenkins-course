// Project guide: step-by-step checklist (rendered in the "🛠 Project guide" view).
window.PROJECT = {
title: "Full CI/CD pipeline with Jenkins: GitHub ➜ SonarQube ➜ Docker ➜ Kubernetes",
intro: "Ithu un portfolio project kutty. Laptop laye Jenkins, SonarQube, kind cluster vechu full pipeline build pannu. Ovvoru step mudinjadhum ✔ tick pannu. Lesson 18 la Malli Akka ithe project ah explain pannuvaanga.",
steps: [
{t:"1. Sample app + repo", d:"Oru chinna Node.js app (illa un app): /healthz endpoint, tests, Dockerfile. GitHub la push pannu.",
 c:`app/
  src/server.js      # express: GET / and GET /healthz
  test/app.test.js   # jest tests (jest-junit reporter)
  package.json       # "test": "jest --ci --reporters=default --reporters=jest-junit"
  Dockerfile         # multi-stage, non-root
  chart/             # helm create chart (image.tag value)
  Jenkinsfile`},
{t:"2. Jenkins + SonarQube with Docker Compose", d:"Jenkins image la Docker CLI venum (agent ah use pannum). Rendum orey compose la.",
 c:`# docker-compose.yml
services:
  jenkins:
    image: jenkins/jenkins:lts-jdk17
    user: root
    ports: ["8080:8080", "50000:50000"]
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
  sonarqube:
    image: sonarqube:lts-community
    ports: ["9000:9000"]
volumes: { jenkins_home: {} }

docker compose up -d
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`},
{t:"3. Jenkins setup", d:"Suggested plugins + indha plugins install pannu. Admin user create pannu.",
 c:`Plugins: Pipeline, Git, GitHub, Docker Pipeline, Credentials Binding,
         SonarQube Scanner, JUnit, Pipeline Stage View, Kubernetes CLI
Inside the container (tools for the pipeline):
  docker exec -u root jenkins bash -c "apt-get update && apt-get install -y docker.io nodejs npm"
  # kubectl, helm, trivy, aws CLI: install the same way (or use docker agents)`},
{t:"4. SonarQube token + quality gate", d:"localhost:9000 (admin/admin ➜ change). My Account ➜ Security ➜ token generate. Jenkins: Manage Jenkins ➜ System ➜ SonarQube servers la 'sonar' nu add pannu. SonarQube ➜ Webhook ➜ http://jenkins:8080/sonarqube-webhook/",
 c:`Jenkins credentials:
  sonar-token      Secret text
SonarQube webhook (for waitForQualityGate):
  http://jenkins:8080/sonarqube-webhook/`},
{t:"5. Credentials", d:"Manage Jenkins ➜ Credentials ➜ global la add pannu.",
 c:`github          GitHub App / PAT (private repo na)
aws-ecr         AWS keys (practice) - real la agent IAM role
kubeconfig-dev  Secret file (~/.kube/config from kind)
sonar-token     Secret text`},
{t:"6. kind cluster + ECR repo", d:"Local Kubernetes cluster, ECR repository. (ECR venaam na Docker Hub use pannalaam.)",
 c:`kind create cluster --name dev
kubectl create namespace dev && kubectl create namespace prod
aws ecr create-repository --repository-name kutty-app --region ap-south-1`},
{t:"7. Jenkinsfile: test + sonar", d:"Mudhal part. Commit panni pipeline velai seyyudha nu paaru.",
 c:`pipeline {
  agent any
  options { timeout(time: 30, unit: 'MINUTES'); buildDiscarder(logRotator(numToKeepStr: '20')) }
  environment {
    ECR   = '123456789012.dkr.ecr.ap-south-1.amazonaws.com'
    IMAGE = "\${ECR}/kutty-app:\${env.GIT_COMMIT.take(7)}"
  }
  stages {
    stage('Test') {
      steps { sh 'npm ci && npm test' }
      post { always { junit 'junit.xml' } }
    }
    stage('SonarQube') {
      steps { withSonarQubeEnv('sonar') { sh 'npx sonar-scanner -Dsonar.projectKey=kutty-app' } }
    }
    stage('Quality Gate') {
      steps { timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true } }
    }`},
{t:"8. Jenkinsfile: image, scan, push", d:"Docker build, Trivy scan (CRITICAL na fail), ECR push.",
 c:`    stage('Image') {
      steps { sh 'docker build -t $IMAGE . && trivy image --exit-code 1 --severity CRITICAL $IMAGE' }
    }
    stage('Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-ecr', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh 'aws ecr get-login-password --region ap-south-1 | docker login -u AWS --password-stdin $ECR && docker push $IMAGE'
        }
      }
    }`},
{t:"9. Jenkinsfile: deploy dev, approve, prod", d:"Helm --atomic, main branch la mattum, prod ku input approval. (kind ku ECR pull secret venum, illa 'kind load docker-image' use pannu.)",
 c:`    stage('Deploy dev') {
      when { branch 'main' }
      environment { KUBECONFIG = credentials('kubeconfig-dev') }
      steps { sh 'helm upgrade --install app chart -n dev --set image.repository=\${IMAGE%:*} --set image.tag=\${IMAGE##*:} --atomic' }
    }
    stage('Approve') {
      when { branch 'main' }
      steps { timeout(time: 30, unit: 'MINUTES') { input message: 'Deploy to prod?' } }
    }
    stage('Deploy prod') {
      when { branch 'main' }
      environment { KUBECONFIG = credentials('kubeconfig-dev') }
      steps { sh 'helm upgrade --install app chart -n prod --set image.repository=\${IMAGE%:*} --set image.tag=\${IMAGE##*:} --atomic' }
    }
  }
  post {
    failure { echo "Build failed: \${env.BUILD_URL}" }
    always  { cleanWs() }
  }
}`},
{t:"10. Multibranch pipeline + webhook", d:"New Item ➜ Multibranch Pipeline ➜ GitHub repo. ngrok vechu webhook add pannu.",
 c:`ngrok http 8080
GitHub repo ➜ Settings ➜ Webhooks ➜ Add:
  Payload URL: https://<ngrok-id>.ngrok-free.app/github-webhook/
  Events: push, pull request`},
{t:"11. PR flow test", d:"Feature branch la change, PR open pannu. Test + Sonar mattum odum (deploy illa). Branch protection la status check required pannu.",
 c:`git checkout -b feature/hello
# change something
git commit -am "Update hello" && git push -u origin feature/hello
gh pr create --fill`},
{t:"12. Main flow test", d:"PR merge pannu. Full pipeline: dev deploy ➜ approval ➜ prod. Smoke test pannu.",
 c:`kubectl -n prod port-forward svc/app 8081:80 &
curl -fsS http://localhost:8081/healthz`},
{t:"13. Speed + reliability", d:"Parallel checks (lint + test), npm cache, retry on network steps. Build time before/after note pannu, interview la numbers sollalaam.",
 c:`stage('Checks') {
  parallel {
    stage('Test') { steps { sh 'npm test' } }
    stage('Lint') { steps { sh 'npm run lint' } }
  }
}
retry(3) { sh 'npm ci' }`},
{t:"14. Same pipeline in GitHub Actions (bonus)", d:"Comparison ku adhe flow ah .github/workflows/ci.yml la ezhudhu, OIDC vechu AWS.",
 c:`on: [push, pull_request]
permissions: { id-token: write, contents: read }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm test`},
{t:"15. README + screenshots", d:"Architecture diagram, stage view screenshot, Sonar dashboard, 'Problems I faced' section. LinkedIn la post podu!",
 c:`README.md
  ## Architecture: GitHub ➜ Jenkins ➜ SonarQube ➜ Trivy ➜ ECR ➜ Helm ➜ Kubernetes
  ## Jenkinsfile walkthrough
  ## Screenshots (stage view, quality gate)
  ## Problems I faced & fixes
  ## Jenkins vs GitHub Actions (what I learned)`}
]};
