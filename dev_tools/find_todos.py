#!/usr/bin/env python3
import os
import re
import datetime
import textwrap


# Dossiers et fichiers à exclure (similaires au script précédent)
EXCLUDE_DIRS = {"node_modules","modules", "college", "lycee", "logiciels", ".next", "dist", ".git", ".vscode"}
EXCLUDE_FILES = {"package-lock.json", ".gitignore", ".DS_Store", "find_todos.py"}
EXCLUDE_PREFIXES = (".eslint",)

# Définition des patterns pour les 5 types de TODO
patterns = [
    # Type 1 : deux barres inverses suivi de TODO:
    (1, re.compile(r'^\s*//TODO:\s*(.+)$', re.MULTILINE)),
    # Type 2 : délimité par "\*TODO:" et "*\" (multi-lignes)
    (2, re.compile(r'/*TODO:\s*(.*?)' + re.escape('*/'), re.DOTALL)),
    # Type 3 : en Python, commentaire avec #
    (3, re.compile(r'^\s*#TODO:\s*(.+)$', re.MULTILINE)),
    # Type 4 : en Python, délimité par triple guillemets
    (4, re.compile(r'"""TODO:\s*(.*?)\s*"""', re.DOTALL)),
    # Type 5 : ligne qui commence (après espaces) par TODO:
    (5, re.compile(r'^\s*TODO:\s*(.+)$', re.MULTILINE)),
]

def get_todos():
    todos = []
    # Ensemble pour stocker (chemin_rel, ligne) déjà vus
    seen = set()

    # Parcours récursif à partir du répertoire courant
    for root, dirs, files in os.walk("."):
        # Exclure certains dossiers
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file in EXCLUDE_FILES or file.startswith(EXCLUDE_PREFIXES):
                continue
            file_path = os.path.join(root, file)
            try:
                with open(file_path, encoding="utf-8") as f:
                    content = f.read()
            except Exception:
                continue

            # Pour chaque pattern, rechercher toutes les occurrences dans le contenu du fichier
            for typ, pattern in patterns:
                for match in pattern.finditer(content):
                    todo_text = match.group(1).strip()
                    
                    # Pour les cas multi-lignes (types 2 et 4), on remplace les retours à la ligne par un espace
                    if typ in (2, 4):
                        todo_text = re.sub(r'\s+', ' ', todo_text)
                    
                    # Déterminer le numéro de ligne en comptant les sauts de ligne
                    line_number = content[:match.start()].count('\n') + 1
                    
                    # Récupération date de modification
                    try:
                        mod_time = os.path.getmtime(file_path)
                        mod_date = datetime.datetime.fromtimestamp(mod_time).strftime("le %d/%m/%Y à %Hh %Mm %Ss")
                    except Exception:
                        mod_date = "Inconnue"
                    
                    # Chemin relatif
                    rel_path = os.path.relpath(file_path, ".")
                    
                    # Vérifier si déjà vu (même fichier, même ligne)
                    if (rel_path, line_number) in seen:
                        continue
                    seen.add((rel_path, line_number))
                    
                    todos.append((todo_text, rel_path, line_number, mod_date))

    # Tri des résultats par chemin de fichier puis par numéro de ligne
    todos.sort(key=lambda x: (x[1], x[2]))
    return todos
def wrap_cell(text, max_width):
    """
    Transforme le contenu d'une cellule (chaîne) en une liste de lignes,
    en respectant les retours à la ligne existants et en enveloppant les lignes
    qui dépassent max_width.
    """
    # Si le texte est vide, renvoyer une liste avec une chaîne vide.
    if not text:
        return [""]
    # Découper d'abord sur les retours à la ligne existants
    lines = text.splitlines() or [text]
    wrapped_lines = []
    for line in lines:
        # Si la ligne est courte, on la garde telle quelle, sinon on la découpe.
        if len(line) <= max_width:
            wrapped_lines.append(line)
        else:
            # textwrap.wrap renvoie une liste de chaînes enveloppées.
            wrapped = textwrap.wrap(line, width=max_width)
            if wrapped:
                wrapped_lines.extend(wrapped)
            else:
                wrapped_lines.append(line)
    return wrapped_lines

def print_table(header, rows, max_width=50):
    """
    Affiche un tableau dont chaque cellule est enveloppée si son contenu dépasse max_width.
    Les sauts de ligne présents dans le texte sont respectés.
    
    :param header: tuple ou liste contenant les intitulés des colonnes.
    :param rows: liste de tuples ou listes représentant les lignes du tableau.
    :param max_width: largeur maximale autorisée pour chaque cellule (défaut: 50).
    """
    num_cols = len(header)
    
    # Pré-traiter l'en-tête et les lignes :
    # Chaque cellule sera transformée en une liste de lignes (après wrapping).
    table = []
    proc_header = [wrap_cell(str(cell), max_width) for cell in header]
    table.append(proc_header)
    for row in rows:
        proc_row = [wrap_cell(str(cell), max_width) for cell in row]
        table.append(proc_row)
    
    # Calculer pour chaque colonne la largeur maximale d'affichage
    col_widths = [0] * num_cols
    for row in table:
        for col in range(num_cols):
            # row[col] est une liste de lignes pour la cellule.
            max_line_len = max((len(line) for line in row[col]), default=0)
            if max_line_len > col_widths[col]:
                col_widths[col] = max_line_len

    # Préparer la ligne séparatrice basée sur la largeur des colonnes
    separator = "-+-".join("-" * width for width in col_widths)
    
    # Fonction pour afficher une ligne de tableau (qui peut s'étaler sur plusieurs lignes)
    def print_row(row_cells):
        # Déterminer le nombre de lignes maximal dans cette ligne de tableau
        max_lines = max(len(cell_lines) for cell_lines in row_cells)
        for i in range(max_lines):
            row_parts = []
            for col in range(num_cols):
                cell_lines = row_cells[col]
                # Si la cellule ne possède pas assez de lignes, on complète par une chaîne vide
                if i < len(cell_lines):
                    cell_line = cell_lines[i]
                else:
                    cell_line = ""
                row_parts.append(cell_line.ljust(col_widths[col]))
            print(" | ".join(row_parts))
    
    # Afficher l'en-tête
    print_row(table[0])
    print(separator)
    # Afficher chaque ligne du tableau
    for row in table[1:]:
        print_row(row)
        print(separator)

def test_case():
    # Construction d'une chaîne de test contenant les 5 cas.
        # Pour obtenir les caractères littéraux désirés, il faut échapper correctement les barres inverses.
    test_content = (
        "Some irrelevant text\n"
        "\\\\TODO: Type 1 todo content.\n"  # Contient deux barres inverses au début
        "Some more text.\n"
        "\\*TODO: Type 2 todo content spanning multiple lines.\n"  # Début du TODO multi-lignes
        "It continues here.\n"
        "*\\\n"  # Fin du TODO multi-lignes
        "Another line.\n"
        "#TODO: Type 3 todo content.\n"
        "Some random text.\n"
        '"""TODO: Type 4 todo content\nspanning multiple lines\nend of todo."""\n'
        "More text.\n"
        "    TODO: Type 5 todo content.\n"
        "End of test.\n"
    )

    # Recherche des TODO dans le contenu de test
    results = []
    for typ, pattern in patterns:
        for match in pattern.finditer(test_content):
            todo_text = match.group(1).strip()
            # Pour les types multi-lignes, on remplace les retours à la ligne par un espace
            if typ in (2, 4):
                todo_text = re.sub(r'\s+', ' ', todo_text)
            # Calcul du numéro de ligne (en comptant les retours à la ligne avant le début du match)
            line_number = test_content[:match.start()].count('\n') + 1
            results.append((typ, line_number, todo_text))

    # Affichage des résultats sous forme de tableau
    header = ("Type", "Line", "Content")
    # Prépare les lignes du tableau (en ajoutant "Type X" pour le type)
    rows = [header] + [(f"Type {r[0]}", str(r[1]), r[2]) for r in results]
    # Calcul de la largeur maximale de chaque colonne
    col_widths = [max(len(row[i]) for row in rows) for i in range(3)]
    # Format de chaque ligne du tableau
    row_format = " | ".join("{:<" + str(width) + "}" for width in col_widths)
    separator = "-+-".join("-" * width for width in col_widths)

    print(row_format.format(*header))
    print(separator)
    for row in rows[1:]:
        print(row_format.format(*row))

if __name__=="__main__":
    # Définir l'en-tête du tableau :
    header = ("TODO", "Fichier", "Ligne", "Date mod.")
    todos=get_todos()
    print_table(header, todos)
    #test_case()