# Guide de Configuration SonarQube - Étape par Étape

## 🎯 Problèmes Identifiés et Solutions

### 1. **SonarQube était "unhealthy"**
   - ✅ **Solution :** Redémarrage du conteneur
   - ✅ **Statut actuel :** "health: starting" - en cours de démarrage

### 2. **Dépendance dupliquée dans pom.xml**
   - ❌ **Problème :** `jackson-datatype-jsr310` déclarée 2 fois
   - ✅ **Solution :** Suppression de la dépendance dupliquée

### 3. **Connection refused à SonarQube**
   - ❌ **Problème :** SonarQube n'était pas prêt
   - ✅ **Solution :** Meilleure attente + vérification de santé

## 📋 Étapes de Configuration SonarQube

### **Étape 1: Vérifier que SonarQube fonctionne**
```bash
# Vérifier l'état
docker-compose ps sonarqube

# Vérifier les logs
docker-compose logs sonarqube --tail=10

# Test de connexion
curl http://localhost:9000/api/system/status
```

### **Étape 2: Accéder à l'interface Web**
1. Ouvrir http://localhost:9000
2. Login par défaut : `admin` / `admin`
3. Changer le mot de passe si demandé

### **Étape 3: Créer un Token pour Jenkins**
1. Aller à : **Administration** → **Security** → **Users**
2. Cliquer sur **Tokens** pour l'utilisateur admin
3. Générer un nouveau token : 
   - **Name :** `jenkins-token`
   - **Type :** `Global Analysis Token`
   - **Expires :** No expiration
4. **Copier le token généré** (remplacer celui dans le Jenkinsfile)

### **Étape 4: Configurer le Projet**
1. Aller à **Projects** → **Create Project**
2. **Project Key :** `TimeSheet`
3. **Display Name :** `TimeSheet`
4. **Main Branch :** `main`

### **Étape 5: Vérifier la Configuration Maven**
Le `pom.xml` doit avoir le plugin SonarQube :
```xml
<plugin>
    <groupId>org.sonarsource.scanner.maven</groupId>
    <artifactId>sonar-maven-plugin</artifactId>
    <version>3.10.0.2594</version>
</plugin>
```

## 🔧 Améliorations Apportées au Jenkinsfile

### **Nouvelles fonctionnalités :**
1. **Meilleure vérification de santé** - Test `/api/system/health`
2. **Attente plus longue** - 60 tentatives au lieu de 30
3. **Compilation avant analyse** - `clean compile test-compile`
4. **Paramètres SonarQube complets** - Coverage, sources, tests
5. **Gestion d'erreurs améliorée** - UNSTABLE au lieu de FAILURE

## 🚀 Test de la Configuration

### **Pour tester maintenant :**
1. **Attendre que SonarQube soit prêt** (2-3 minutes)
2. **Vérifier la connexion :**
   ```bash
   curl http://localhost:9000/api/system/status
   ```
3. **Lancer le pipeline Jenkins**

### **Résultat attendu :**
- ✅ Unit Tests : PASS
- ✅ SonarQube Analysis : PASS
- ✅ Rapports disponibles dans SonarQube Web UI

## 🔍 Debugging

### **Si SonarQube ne fonctionne toujours pas :**
```bash
# Logs détaillés
docker-compose logs sonarqube --tail=50

# Redémarrage complet
docker-compose down
docker-compose up -d postgres
sleep 30
docker-compose up -d sonarqube

# Vérification mémoire (SonarQube a besoin de ressources)
docker stats sonarqube
```

### **Vérification du Token :**
```bash
curl -u sqp_f1faddc336afb599195d7151b784f32e97aadc5f: \
  http://localhost:9000/api/authentication/validate
```
