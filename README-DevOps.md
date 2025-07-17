# 🚀 Pipeline DevOps - Application TimeSheet

## 📋 Vue d'ensemble du projet

Ce projet implémente une solution DevOps complète pour l'application **TimeSheet**, une application web composée d'un backend Spring Boot et d'un frontend Angular. L'infrastructure DevOps utilise Jenkins pour l'intégration continue et le déploiement continu (CI/CD), avec une orchestration complète via Docker Compose.

## 🏗️ Architecture générale

### Composants de l'application
- **Backend**: Spring Boot 3.1.4 avec Java 17
- **Frontend**: Angular 16 avec TypeScript
- **Base de données**: MySQL 8.0
- **Serveur web**: Nginx (pour le frontend)

### Outils DevOps
- **CI/CD**: Jenkins avec pipeline déclaratif
- **Conteneurisation**: Docker et Docker Compose
- **Qualité du code**: SonarQube Community
- **Gestion des artifacts**: Nexus Repository Manager
- **Monitoring**: Prometheus + Grafana
- **Base de données pour SonarQube**: PostgreSQL 13

### Composants DevOps utilisés

| Élément | Outil utilisé | Rôle |
|---------|---------------|------|
| **Intégration Continue** | Jenkins | Orchestration du pipeline CI/CD, automatisation des builds et déploiements |
| **Conteneurisation** | Docker | Containerisation des applications et services |
| **Orchestration** | Docker Compose | Gestion multi-conteneurs et déploiement des services |
| **Qualité du code** | SonarQube Community | Analyse statique, détection des vulnérabilités et métriques qualité |
| **Tests unitaires** | JUnit + Maven Surefire | Exécution des tests automatisés |
| **Couverture de code** | JaCoCo | Mesure et reporting de la couverture de tests |
| **Gestion des artifacts** | Nexus Repository Manager | Stockage et gestion des dépendances Maven |
| **Monitoring** | Prometheus | Collecte et stockage des métriques système et applicatives |
| **Visualisation** | Grafana | Dashboards et alerting pour le monitoring |
| **Métriques système** | Node Exporter | Export des métriques système (CPU, RAM, disque) |
| **Métriques web** | Nginx Exporter | Export des métriques du serveur web Nginx |
| **Sécurité conteneurs** | Trivy | Scan des vulnérabilités dans les images Docker |
| **Base de données app** | MySQL 8.0 | Base de données principale de l'application TimeSheet |
| **Base de données SonarQube** | PostgreSQL 13 | Base de données dédiée pour SonarQube |
| **Build Java** | Maven | Gestionnaire de dépendances et build tool pour Spring Boot |
| **Build JavaScript** | npm + Angular CLI | Gestionnaire de paquets et build tool pour Angular |
| **Runtime Java** | OpenJDK 17 | Environnement d'exécution Java pour Spring Boot |
| **Runtime JavaScript** | Node.js 20 LTS | Environnement d'exécution pour Angular |
| **Serveur web** | Nginx | Serveur web pour héberger l'application Angular |
| **Reverse proxy** | Nginx | Routage des requêtes entre frontend et backend |

## 🔄 Pipeline Jenkins - Analyse détaillée

Le pipeline Jenkins est composé de **11 étapes principales** qui couvrent l'ensemble du cycle de vie DevOps :

### 1. 📥 Source Code Checkout
**Objectif**: Récupération du code source depuis le dépôt Git

```jenkinsfile
stage('Source Code Checkout') {
    steps {
        checkout scm
        // Détection de la plateforme et vérification Docker
    }
}
```

**Actions réalisées**:
- Clonage du repository Git
- Vérification de l'environnement Jenkins (Unix/Linux)
- Contrôle de la disponibilité de Docker

### 2. 🔧 Repository Services Deployment
**Objectif**: Déploiement des services d'analyse et de gestion des artifacts

**Services déployés**:
- **PostgreSQL**: Base de données pour SonarQube
- **SonarQube**: Analyse statique du code
- **Nexus**: Gestionnaire de repository Maven

**Commandes Docker Compose**:
```bash
docker-compose down sonarqube nexus postgres --remove-orphans
docker-compose up -d postgres
docker-compose up -d sonarqube nexus
```

### 3. ✅ Code Analysis Services Readiness Verification
**Objectif**: Vérification de la disponibilité des services d'analyse

**Vérifications effectuées**:
- Test de connectivité SonarQube (endpoint `/api/system/status`)
- Test de connectivité Nexus (endpoint `/service/rest/v1/status`)
- Timeout de 30 tentatives avec intervalle de 10 secondes

### 4. 🧪 Execute Unit Tests & Code Coverage Analysis
**Objectif**: Exécution des tests unitaires et génération des rapports de couverture

**Technologies utilisées**:
- **JaCoCo**: Analyse de couverture de code
- **Maven Surefire**: Tests unitaires
- **JUnit**: Framework de tests

**Commandes Maven**:
```bash
./mvnw clean test jacoco:report
```

**Artifacts générés**:
- Rapports JUnit XML
- Rapport de couverture JaCoCo
- Archivage automatique dans Jenkins

### 5. 📊 Static Code Quality Analysis
**Objectif**: Analyse statique du code avec SonarQube

**Configuration SonarQube**:
- **Projet**: TimeSheet Application
- **Token d'authentification**: Sécurisé
- **Rapports de couverture**: JaCoCo XML
- **Sources**: `src/main/java`
- **Tests**: `src/test/java`

**Commande Maven**:
```bash
./mvnw sonar:sonar \
    -Dsonar.projectKey=TimeSheet \
    -Dsonar.host.url=http://sonarqube:9000 \
    -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

### 6. 📦 Artifact Repository Deployment
**Objectif**: Déploiement des artifacts dans Nexus Repository

**Configuration Maven**:
- Repository pour snapshots: `maven-snapshots-timesheet`
- Repository pour releases: `maven-releases-timesheet`
- Authentification via `settings.xml`

**Commande de déploiement**:
```bash
./mvnw clean deploy -DskipTests \
    -s ../settings.xml \
    -DaltDeploymentRepository=nexus-snapshots::default::http://nexus:8081/repository/maven-snapshots-timesheet/
```

### 7. 🏗️ Backend Application Build
**Objectif**: Compilation et containerisation du backend Spring Boot

**Étapes de build**:
1. **Compilation Maven**: `./mvnw clean package -DskipTests`
2. **Création de l'image Docker**: 
   ```bash
   docker build -t localhost:5000/timesheet-backend:${BUILD_NUMBER} .
   docker build -t localhost:5000/timesheet-backend:latest .
   ```

### 8. 🎨 Frontend Application Build
**Objectif**: Compilation et containerisation du frontend Angular

**Étapes de build**:
1. **Installation des dépendances**: `npm ci`
2. **Build de production**: `npm run build --prod`
3. **Création de l'image Docker**:
   ```bash
   docker build -t localhost:5000/timesheet-frontend:${BUILD_NUMBER} .
   docker build -t localhost:5000/timesheet-frontend:latest .
   ```

### 9. 🔒 Container Security Scanning (Trivy)
**Objectif**: Analyse de sécurité des images Docker avec Trivy

**Analyses effectuées**:
- Scan des vulnérabilités des images Docker
- Génération de rapports de sécurité
- Archivage des rapports dans Jenkins

**Note**: Cette étape est configurée mais les commandes Trivy spécifiques ne sont pas visibles dans le code fourni.

### 10. 🗄️ Infrastructure Services Deployment
**Objectif**: Déploiement des services d'infrastructure

**Service déployé**:
- **MySQL 8.0**: Base de données principale de l'application
- **Configuration**: Port 3307, base `timesheetintegration`
- **Healthcheck**: Vérification avec `mysqladmin ping`

### 11. 🚀 Application Services Deployment
**Objectif**: Déploiement des services applicatifs

**Services déployés en séquence**:
1. **Backend Spring Boot** (port 8083)
2. **Frontend Angular** (port 4200)

### 12. 📈 Monitoring Stack Deployment
**Objectif**: Déploiement de la pile de monitoring

**Services de monitoring**:
- **Prometheus**: Collecte des métriques (port 9090)
- **Grafana**: Dashboards de visualisation (port 3000)
- **Node Exporter**: Métriques système (port 9100)
- **Nginx Exporter**: Métriques serveur web (port 9113)

### 13. 🏥 Application Health Verification
**Objectif**: Vérification de la santé des services déployés

**Vérifications effectuées**:
- **Backend**: Test de l'endpoint `/actuator/health`
- **Frontend**: Test de disponibilité HTTP
- **Monitoring**: Vérification Prometheus et Grafana

## 📂 Configuration Docker Compose

### Services principaux

| Service | Image | Port | Fonction |
|---------|-------|------|----------|
| mysql | mysql:8.0 | 3307 | Base de données principale |
| backend | Build local | 8083 | API Spring Boot |
| frontend | Build local | 4200 | Interface Angular |
| postgres | postgres:13 | 5432 | Base SonarQube |
| sonarqube | sonarqube:community | 9000 | Analyse qualité code |
| nexus | sonatype/nexus3 | 8081 | Repository Maven |
| prometheus | Build monitoring | 9090 | Collecte métriques |
| grafana | grafana/grafana | 3000 | Dashboards |

### Volumes persistants
- `mysql_data`: Données MySQL
- `postgres_data`: Données PostgreSQL
- `sonarqube_data`: Données SonarQube
- `nexus_data`: Repository Nexus
- `prometheus_data`: Métriques Prometheus
- `grafana_data`: Configuration Grafana

## 🔧 Configuration Jenkins

### Image Jenkins personnalisée
L'image Jenkins inclut tous les outils nécessaires :

**Outils de développement**:
- Java 17 JDK
- Maven (dernière version)
- Node.js 20 LTS
- Angular CLI

**Outils DevOps**:
- Docker CLI
- Docker Compose v2.18.1
- Git

**Plugins Jenkins essentiels**:
- Pipeline Workflow
- Blue Ocean
- Docker Plugin
- SonarQube Scanner
- Maven Integration
- JUnit Publisher
- JaCoCo Publisher

### Variables d'environnement Jenkins
```bash
DOCKER_REGISTRY=localhost:5000
FRONTEND_IMAGE=${DOCKER_REGISTRY}/timesheet-frontend
BACKEND_IMAGE=${DOCKER_REGISTRY}/timesheet-backend
MAVEN_OPTS=-Dmaven.repo.local=/var/jenkins_home/.m2/repository
```

## 📊 Monitoring et observabilité

### Métriques collectées
- **Métriques système**: CPU, mémoire, disque (Node Exporter)
- **Métriques applicatives**: Spring Boot Actuator
- **Métriques web**: Nginx (Nginx Exporter)
- **Métriques conteneurs**: Docker

### Dashboards Grafana
- Dashboard système général
- Dashboard Spring Boot détaillé
- Dashboard spécifique TimeSheet

## 🔐 Sécurité et qualité

### Analyse de qualité (SonarQube)
- **Couverture de code**: JaCoCo integration
- **Règles qualité**: SonarWay (Java)
- **Security Hotspots**: Détection automatique
- **Code Smells**: Analyse des anti-patterns

### Sécurité des conteneurs
- **Trivy Scanner**: Analyse des vulnérabilités
- **Images officielles**: Utilisation d'images Docker officielles
- **Principe du moindre privilège**: Utilisateurs non-root

## 🚀 Déploiement et accès

### URLs d'accès après déploiement
- **Application Frontend**: http://localhost:4200
- **API Backend**: http://localhost:8083
- **SonarQube**: http://localhost:9000
- **Nexus Repository**: http://localhost:8081
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jenkins**: http://localhost:8080

### Commandes de déploiement manuel
```bash
# Construction de l'image Jenkins
docker build -t jenkins-timesheet ./jenkins

# Lancement complet via Docker Compose
docker-compose up -d

# Vérification des services
docker-compose ps
```

## 📈 Métriques de performance du pipeline

### Temps d'exécution estimés
- **Checkout**: ~30 secondes
- **Services deployment**: ~2 minutes
- **Tests unitaires**: ~3-5 minutes
- **Analyse SonarQube**: ~2-3 minutes
- **Build applications**: ~5-7 minutes
- **Déploiement**: ~2-3 minutes
- **Total**: ~15-20 minutes

### Critères de succès
- ✅ Tests unitaires passent (>90% succès)
- ✅ Couverture de code >70%
- ✅ Quality Gate SonarQube validée
- ✅ Tous les services healthy
- ✅ Endpoints applicatifs répondent

## 🛠️ Maintenance et troubleshooting

### Commandes utiles
```bash
# Logs des services
docker-compose logs [service_name]

# Redémarrage d'un service
docker-compose restart [service_name]

# Nettoyage complet
docker-compose down --volumes --remove-orphans
docker system prune -f

# Vérification santé des services
docker-compose ps
```

### Points de vigilance
- **Ressources système**: Minimum 8GB RAM recommandé
- **Espace disque**: ~20GB pour tous les services
- **Ports réseau**: Vérifier la disponibilité des ports listés
- **Permissions Docker**: Utilisateur Jenkins dans le groupe docker

## 📝 Conclusion

Cette infrastructure DevOps offre une solution complète et robuste pour le développement, l'intégration et le déploiement de l'application TimeSheet. Elle garantit :

- **Qualité du code** via SonarQube et tests automatisés
- **Sécurité** par l'analyse des vulnérabilités
- **Observabilité** complète via Prometheus/Grafana
- **Traçabilité** des artifacts via Nexus
- **Automatisation** complète du cycle de vie

Le pipeline implémente les meilleures pratiques DevOps et peut servir de référence pour des projets similaires utilisant les technologies Spring Boot et Angular.
