# Guide d'insertion d'un utilisateur DT (Directeur Technique)

## Méthode 1 : Insertion directe via SQL

### Créer un utilisateur DT avec mot de passe crypté

```sql
-- 1. D'abord, générer un mot de passe BCrypt
-- Utilisez un outil en ligne ou le programme BCryptGen.java dans le projet
-- Exemple : pour le mot de passe "password123", le hash BCrypt est:
-- $2a$10$X...votre_hash_bcrypt_ici...

-- 2. Insérer l'utilisateur dans la base de données
INSERT INTO users (
    email,
    password,
    full_name,
    role,
    phone,
    created_at,
    status
) VALUES (
    'dt@algerac.dz',
    '$2a$10$TDA11x11HAD4ZO3aJHnGiOTb9VUOZxX96d7Jf6CeK.x2eNqTynYO2',  -- Remplacer par votre hash BCrypt
    'Directeur Technique',
    'DT',
    '0555123456',
    NOW(),
    'APPROVED'
);
```

## Méthode 2 : Utiliser BCryptGen pour générer le hash

### Étape 1 : Compiler et exécuter BCryptGen

```bash
cd backend
javac -cp target/classes src/main/java/com/algerac/util/BCryptGen.java
java -cp "target/classes;lib/*" com.algerac.util.BCryptGen
```

Entrez votre mot de passe souhaité, et le programme affichera le hash BCrypt.

### Étape 2 : Utiliser le hash dans l'insertion SQL

Copiez le hash généré et utilisez-le dans la commande SQL ci-dessus.

## Méthode 3 : Via l'application Java (recommandée pour production)

### Créer un endpoint temporaire ou utiliser un script

```java
// Dans un test ou script d'initialisation
@Service
public class InitService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Transactional
    public void createDTUser() {
        if (!userRepository.existsByEmail("directeur.technique@algerac.dz")) {
            User dtUser = User.builder()
                .email("directeur.technique@algerac.dz")
                .password(passwordEncoder.encode("VotreMotDePasseSecurise"))
                .fullName("Directeur Technique")
                .role(UserRole.DT)
                .phone("0555123456")
                .createdAt(LocalDateTime.now())
                .status("APPROVED")
                .build();
                
            userRepository.save(dtUser);
            System.out.println("Utilisateur DT créé avec succès!");
        }
    }
}
```

## Méthode 4 : Via seed-data.sql (recommandée pour développement)

Modifiez le fichier `backend/src/main/resources/seed-data.sql` :

```sql
-- Ajouter un utilisateur DT
INSERT INTO users (email, password, full_name, role, phone, created_at, status) 
VALUES (
    'dt@algerac.dz',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cyhQQxYWpACsm.60Wd5fhBP1.KXpa',  -- mot de passe: "mdps123"
    'Ahmed Directeur',
    'DT',
    '0555123456',
    CURRENT_TIMESTAMP,
    'APPROVED'
);
```

Puis redémarrez l'application pour que les données soient chargées.

## Vérification

Pour vérifier que l'utilisateur a été créé correctement :

```sql
SELECT id, email, full_name, role, status, created_at 
FROM users 
WHERE role = 'DT';
```

## Connexion

Une fois l'utilisateur créé, vous pouvez vous connecter avec :
- **Email** : `directeur.technique@algerac.dz` (ou l'email que vous avez choisi)
- **Mot de passe** : celui que vous avez utilisé pour générer le hash BCrypt

## Permissions du rôle DT

Le rôle DT a accès aux fonctionnalités suivantes :
- **Dashboard** : Vue d'ensemble des candidatures et statistiques
- **Candidatures** : Gestion des demandes d'inscription des experts/évaluateurs/formateurs
- **Experts Certifiés** : Liste des experts approuvés et actifs
- **Évaluation** : Outils d'évaluation des candidatures
- **Rapports** : Génération de rapports et statistiques

## Notes importantes

1. **Sécurité** : Utilisez toujours des mots de passe forts pour les comptes administratifs
2. **Hash BCrypt** : Ne jamais stocker les mots de passe en clair
3. **Status** : Assurez-vous que le statut est "APPROVED" pour permettre la connexion
4. **Role** : Le rôle doit être exactement "DT" (sensible à la casse)

## Dépannage

### L'utilisateur ne peut pas se connecter
- Vérifiez que le statut est "APPROVED"
- Vérifiez que le hash du mot de passe est correct
- Vérifiez que l'email est exact

### Erreur "Role not found"
- Vérifiez que UserRole.DT existe dans l'enum
- Redémarrez l'application après modification de l'enum
