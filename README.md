# SubTracker

SubTracker est un petit service permettant de **centraliser et suivre vos abonnements** :  
tableau de bord, calendrier des paiements, export des échéances, synchronisation bancaire et génération de lettres de résiliation assistée par **IA**.

---

##  Présentation

SubTracker vous permet de :

- Ajouter et gérer vos abonnements (prix, cycle, prochaine échéance, catégorie)
- Visualiser les paiements à venir dans un **calendrier**
- Exporter vos échéances au format **.ics**
- Synchroniser automatiquement vos abonnements via **Plaid**
- Générer des **lettres de résiliation** grâce à l’IA

---

##  Installation (locale)

### Prérequis

- **Node.js** ≥ 16
- **npm**
- **MongoDB** (URI accessible)

### Étapes

```bash
# Cloner le dépôt
git clone <repo-url>
cd subTracker

# Installer les dépendances
npm install
```

---

##  Technologies utilisées

### Backend

- **Node.js**  
  Environnement JavaScript côté serveur  
  Exécute l’application

- **Express.js**  
  Framework backend  
  Gère les routes, middlewares, formulaires et sessions

- **MongoDB**  
  Base de données NoSQL  
  Stocke les abonnements, utilisateurs et catégories

---

### Frontend

- **EJS**  
  Moteur de templates  
  Utilisé pour le dashboard, le login, l’inscription et les formulaires

- **CSS**  
  Styles personnalisés  
  Gestion du layout, des couleurs et du responsive

- **JavaScript**  
  Interactions côté client  
  Confirmation de suppression, actions dynamiques

---
