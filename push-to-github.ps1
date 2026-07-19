# Script pour initialiser et publier le projet Pharmagest sur GitHub

Write-Host "=== Publication de Pharmagest sur GitHub ===" -ForegroundColor Cyan

# 1. Vérifier si git est installé
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Erreur: Git n'est pas installé sur votre système." -ForegroundColor Red
    Write-Host "Veuillez installer Git depuis https://git-scm.com/" -ForegroundColor Yellow
    exit
}

# 2. Initialiser git si pas déjà fait
if (-not (Test-Path ".git")) {
    Write-Host "Initialisation du dépôt Git local..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# 3. Ajouter tous les fichiers et faire le premier commit
Write-Host "Ajout des fichiers au suivi Git..." -ForegroundColor Yellow
git add .
git commit -m "Initial commit - Pharmagest"

# 4. Vérifier si GitHub CLI (gh) est disponible
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "GitHub CLI (gh) détecté. Création automatique du dépôt GitHub..." -ForegroundColor Green
    $repoVisibility = Read-Host "Souhaitez-vous un dépôt public ou privé ? (public/private) [défaut: public]"
    if ([string]::IsNullOrWhiteSpace($repoVisibility)) { $repoVisibility = "public" }
    
    gh repo create pharmagest --$repoVisibility --source=. --remote=origin --push
    Write-Host "✅ Projet publié avec succès sur GitHub!" -ForegroundColor Green
} else {
    Write-Host "`n--- Dépôt GitHub distant ---" -ForegroundColor Yellow
    Write-Host "1. Créez un nouveau dépôt vide sur GitHub (https://github.com/new) nommé 'pharmagest'."
    Write-Host "2. Copiez l'URL du dépôt (ex: https://github.com/votre-compte/pharmagest.git)."
    
    $remoteUrl = Read-Host "Entrez l'URL du dépôt GitHub distant"
    if (-not [string]::IsNullOrWhiteSpace($remoteUrl)) {
        git remote remove origin 2>$null
        git remote add origin $remoteUrl
        git push -u origin main
        Write-Host "✅ Projet publié avec succès sur GitHub!" -ForegroundColor Green
    } else {
        Write-Host "URL non fournie. Exécutez manuellement:" -ForegroundColor Yellow
        Write-Host "git remote add origin <URL_DE_VOTRE_REPO>" -ForegroundColor Gray
        Write-Host "git push -u origin main" -ForegroundColor Gray
    }
}
