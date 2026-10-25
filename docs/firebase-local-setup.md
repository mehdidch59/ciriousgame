# Inscription bloquée en réseau local

## Cause vérifiée le 25 octobre 2026

La clé Firebase web refuse les origines locales : `API_KEY_HTTP_REFERRER_BLOCKED`, HTTP 403. L’adresse publique `https://ciriousgame.mehdichafai.me/` franchit cette restriction. Le serveur local du téléphone écoute sur `0.0.0.0:4174` et l’IPv4 du PC observée est `192.168.1.14`.

Ce blocage n’est ni une panne du Wi-Fi ni une erreur de mot de passe. L’ajout de `localhost` aux domaines autorisés de Firebase Authentication ne remplace pas les restrictions de référents de la clé dans Google Cloud.

## Correction d’administration requise

Dans [Google Cloud — Identifiants du projet](https://console.cloud.google.com/apis/credentials?project=ciriousgame), ouvrir la clé correspondant à `VITE_API_KEY`, puis **Restrictions relatives aux applications → Sites Web**. Conserver les entrées existantes et ajouter les adresses de test nécessaires :

```text
http://192.168.1.14:4174/*
http://127.0.0.1:4173/*
http://localhost:4173/*
```

Ne pas retirer les restrictions globalement. Ne pas ajouter un joker pour tous les sites. Les restrictions relatives aux API Firebase doivent rester en place. Une clé de développement distincte, restreinte à ces adresses, est aussi possible ; sa valeur doit alors être fournie à Vite avant de reconstruire le projet. L’IP peut changer avec le réseau : adapter l’entrée à l’adresse réellement utilisée.

Le correctif ne consiste pas à remplacer le référent du navigateur, ni à créer un proxy de contournement. Aucune modification distante des restrictions n’a été effectuée par l’agent : la console demande une connexion Google Cloud administrateur.

## Vérification sans compte de test

Depuis la racine du projet :

```powershell
npm run check-auth -- http://192.168.1.14:4174
npm run check-auth -- http://127.0.0.1:4173
```

Le script lit la configuration Vite sans afficher la clé. Il envoie une requête de connexion volontairement dépourvue d’identifiant et de mot de passe : aucun compte ne peut être créé ni connecté. La réponse `MISSING_EMAIL` signifie que l’origine a franchi les restrictions de clé, pas qu’une inscription réelle a été validée. Une erreur de référent produit un code de sortie 1 et un diagnostic explicite.

Après enregistrement de la configuration, relancer le diagnostic puis réessayer l’inscription dans Safari. Si une erreur `auth/operation-not-allowed` apparaît ensuite, vérifier l’activation du fournisseur E-mail/Mot de passe dans Firebase Authentication. Le formulaire distingue désormais les erreurs de configuration, de réseau et d’identifiants.

Sources : [restrictions des clés Google Cloud](https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys), [clés Firebase](https://firebase.google.com/docs/projects/api-keys), [authentification par mot de passe](https://firebase.google.com/docs/auth/web/password-auth).
