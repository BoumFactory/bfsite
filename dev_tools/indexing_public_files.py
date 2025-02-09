#!/usr/bin/env python3
import os
import json

# Répertoire à scanner
FILES_DIR = os.path.join("public", "files")
# Fichier JSON d'indexation
INDEX_FILE = "pages/files_index.json"

# On ne veut indexer que les extensions suivantes :
ALLOWED_EXTS = {".pdf", ".tex"}

# Mots présents dans le titre qu'on ne veut pas ( fichiers secondaires )
EXCLUDED_KEYWORDS = {"bfpoints"}
# Champs par défaut à indexer (valeurs initiales vides)
default_fields = {
    "tags": [],
    "description": ""
}

# Champs supplémentaires (peuvent être étendus à volonté)
extra_fields = {
    # Par exemple un champ "description courte"
    "description courte": ""
}

# On ajoute tous les champs dans un seul dictionnaire
#default_fields.update(extra_fields) #démuter pour apporter la modification

def load_index(index_file):
    """Charge le fichier d'index JSON s'il existe, sinon renvoie une liste vide."""
    if os.path.exists(index_file):
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Erreur de décodage JSON dans {index_file}. On repart sur un index vide.")
            return []
    return []

def save_index(index_data, index_file):
    """Enregistre l'index dans le fichier JSON."""
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=4)

def update_index():
    # Charger l'index existant (liste de dictionnaires)
    index_data = load_index(INDEX_FILE)
    # Pour faciliter la mise à jour, on convertit en dict indexé par "path"
    index_dict = {entry["path"]: entry for entry in index_data if "path" in entry}

    # Parcours récursif du dossier FILES_DIR
    for root, dirs, files in os.walk(FILES_DIR):
        for file in files:
            ext = os.path.splitext(file)[1].lower()  # Extension
            if ext not in ALLOWED_EXTS:
                # On ignore tous les fichiers qui ne sont pas .pdf ou .tex
                continue
            msum = sum([int(word in file) for word in EXCLUDED_KEYWORDS])
            if msum>0:
                # On ignore tous les fichiers qui ne sont pas .pdf ou .tex
                continue
            
            full_path = os.path.join(root, file)
            # Calculer le chemin relatif par rapport à FILES_DIR
            rel_path = os.path.relpath(full_path, FILES_DIR)

            # Déterminer le type du fichier
            file_type = "pdf" if ext == ".pdf" else "tex"

            # Vérifier si on a déjà une entrée pour ce chemin
            if rel_path in index_dict:
                entry = index_dict[rel_path]
                # Mettre à jour ou ajouter les champs manquants
                for key, default_val in default_fields.items():
                    if key not in entry:
                        entry[key] = default_val
                # Ajouter ou mettre à jour le file_type
                entry["file_type"] = file_type
            else:
                # Nouvelle entrée
                entry = {"path": rel_path, "file_type": file_type}
                # Ajouter les champs par défaut
                for key, default_val in default_fields.items():
                    entry[key] = default_val
                # Insérer dans notre dictionnaire
                index_dict[rel_path] = entry

    # Optionnel : supprimer les entrées dont le fichier n'existe plus
    updated_index = []
    for path, entry in index_dict.items():
    # Vérification que le fichier existe encore
        if os.path.exists(os.path.join(FILES_DIR, path)):
            updated_index.append(entry)
    index_dict = {e["path"]: e for e in updated_index}

    # Conversion en liste pour l'écriture dans le fichier JSON
    updated_index = list(index_dict.values())
    save_index(updated_index, INDEX_FILE)

    print(f"Indexation terminée. {len(updated_index)} fichiers indexés dans '{INDEX_FILE}'.")

if __name__ == "__main__":
    update_index()
