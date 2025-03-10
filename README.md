Projet de la formation "Dev Web- Web Mobile" chez Openclassrooms

-------------------------------------------

le fichier principal server.js :

- on importe le module http pour créer un serveur web, écouter les requêtes et y répondre
- on importe l'application Express configurée dans app.js
- on définit le port utilisé dynamiquement, avec la vvaleur définie sur 4000 par défaut
- on crée une instance du serveur avec l'application app qu'on a précédemment importée
- on gère les erreurs éventuelles (si des privilèges sont nécessaires ou si le port est déjà utilisé)
- on gère l'évènement d'écoute de l'adresse et du port
- on démare le serveur et on écoute le port défini

-------------------------------------------

l'application app.js :

- on importe les modules nécessaires
	Express permet de gérer les routes, les requêtes http, et les middlewares
	Mongoose permet d'interagir avec la BDD mongoDB
	on crée l'application Express
	on importe les routes de gestion des livres
	on importe les routes de gestion des utilisateurs
	on importe le module de gestion des chemins de fichiers
- on connecte à la BDD
- on configure le CORS pour avoir accès depuis n'importe où à l'API
- le middleware pour pouvoir lire correctement les json
- on définit les routes qui seront celles utilisées par les routeurs
- le middleware pour traiter les fichiers statiques (ici les images)
- enfin on exporte l'application pour être utilisable via server.js

-------------------------------------------

les modèles :
- le premier schema : BookSchema définit la structure des livres
avec des éléments obliigatoires, sauf l'averageRating
et avec notamment ratings qui est un tableau d'objets
- un second shema : UserSchema définit la structure des utilisateurs
avec deux éléments obligatoires : le mail et le mot de passe
ici on a importé mongoose-unique-validator afin de garder des utilisateurs à l'email unique
- on export donc à chaque fois le modèle avec son nom et son schéma

-------------------------------------------

les middleware utilisés :
- auth.js
on importe jsonwebtoken afin de gérer les tokens pour authentifier les utilisateurs
on coupe en 2 la requête pour récupérer uniquement le token dans la requête (retirer le "Bearer ")
on vérifie le token avec la clé
puis on ajoute l'id de l'utilisateur à l'objet req.auth
- multer-config.js
on importe la bibliothèque multer afin de gérer l'upload d'images dans node.JS
le type MIME permet de gérer les types de fichiers autorisés, ici on choisis les images les plus courantes jpg et png
la destination définit le dossier où seront stockées les images
on génère un nom de fichier à partir du nom de l'upload sans les espaces, ainsi que la date actuelle afin de garantir l'unicité du nom de fichier
on exporte l'instance avec la  config de stockage créée et le fichier unique

-------------------------------------------

les routes :
- books.js
	- le routeur Express permet de gérer les routes
	- on importe les middlewares et le contrôleur
	- on définit les routes dans un ordre spécifique,
	pour exemple si on écoute /bestrating après /:id alors le contrôleur bestrating ne sera jamais appelé car considéré comme une id dans la route /:id
	- lorsque l'authentification est nécessaire, on l'appellera en premier, avant les autres middlewares et le contrôleur
	- on a besoin d'authentification pour créer un livre, le modifier, le noter et le supprimer, pas pour les consultations (get)
- user.js
	- rien de particulier, pas besoin d'authentification, ni pour le login ni pour l'inscription

-------------------------------------------

les contrôleurs :
- books.js
	- le module path permet de gérer les chemins de fichiers et répertoires plus facilement
	- sharp est une bibliothèque de traitement des images, utile ici pour les formater et les compresser
	- fs (file system) est un module pour gérer notamment la lecture des fichiers
	- getAllBooks retourne tous les livres
	- getOneBook retourne un seul livre en fonction de l'élément dynamique id de l'url
	- createBook récupère sous forme de JSON le contenu de la requête
		- on supprime les éléments non utilisés de la requête (les book id qu'on génère en interne, et user id qu'on récupère autrement)
		- important : on récupère en input le chemin vers le fichier qu'on va traiter
		- on définit le nom du fichier en output sous format webp
		- on prépare le fichier image
		- le if(rating) n'était pas nécessaire mais je l'ai intégré en prévision d'un frontend fonctionnel dans ce sens
		- on prépare le livre avec notamment le chemin de destination, l'userId récupéré par le middleware auth, les rating et averageRating
		- on enregistre le livre
	- modifyBook fonctionne à peu près comme createBook au niveau de la gestion du fichier image
		- il vérifie s'il y a un fichier dans la requête, et selon, traite la requête différemment (contenant un objet book ou pas)
		- il vérifie que celui qui modifie le livre est bien celui qui l'a publié
		- puis update le livre avec les nouvelles données de la requête, et l'id du livre récupérée de l'url
	- deleteBook recherche le livre avec l'id de l'url
		- vérifie que celui qui veut delete correspond à celui qui a créé le livre
		- supprime grâce au unlink le fichier image
		- et delete le book
	- createRating vérifie que le livre existe, et si l'utilisateur a déjà noté ce livre
		- rajoute le nouveau rating dans le tableau des ratings, recalcule l'averageRating grâce à la taille du tableau
		- enregistre le livre
	- getBestBooks trie les livres en décroissant selon leur averageRating et renvoie les 3 premiers
- user.js
	- importe la bibliothèque de chiffrement de mots de passe bcrypt, et jsonwebtoken pour la gestion des tokens
	- signup hash le code en 10 boucles, puis enregistre le user avec son mail et le mot de passe hashé
	- login vérifie que l'utilisateur existe sinon erreur
		- puis compare les deux hash des mots de passes
		- puis attribue un token pour 24h

-------------------------------------------