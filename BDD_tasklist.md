# Given that the user is on the chemicals tab...
## ...and viewing multiple chemicals
+ **When** the user has not put in any query filters, **then** the list of all chemicals in the inventory is shown in alphabetical order [2][20]
+ **When** the user has put in a specific chemical group and/or a search term (name / molecular formula / concentration of an aqueous solution), **then** the list of chemicals matching such conditions is shown in alphabetical order [3][20]
## ...and viewing a single chemical
+ **then** all the following items are shown to the user:
  - Name
  - Molecular formula
  - Chemical groups
  - Remaining amounts, shown in a list, where each item contains:
      + Container size
      + Current remaining amount in that container
  - 2D structure [8]
  - GHS pictograms [9]
  - GHS hazard statements [9]
  - NFPA 704 diamond [9]
  - Material Safety Data Sheet [10]
  - Waste disposal methods [11]
+ **when** the user changes the remaining amount of a chemical by: [5]
  - adding a container with a specific size...
      + **and** providing a current remaining amount for that container, **then** a new container with the specified current remaining amount should be:
        -  added to the inventory
        -  visible to the user
      + **without** providing a current remaining amount for that container, **then** a new container with the default current remaining amount of 0 g should be:
        -  added to the inventory
        -  visible to the user
  - editing a container's...
      + size, **then** the change should be:
          - reflected in the inventory
          - visible to the user
      + current remaining amount, **then** the change should be:
          - reflected in the inventory
          - visible to the user
  - deleting a container, **then** the change should be:
      - reflected in the inventory
      - visible to the user
+ **when** the user deletes a chemical, **then** the change should be: [6]
  - reflected in the inventory
  - visible to the user
+ **when** the user replaces a chemical (by choosing a different name / molecular formula), **then** the change should be: [6]
  - reflected in the inventory
  - visible to the user
## ...and adding a chemical [4]
+ **when** the user is typing the name or molecular formula, **then** the program should suggest autocomplete options
+ **when** the user has finished typing, **then** a list of matching chemicals should be shown to the user
+ **when** the user has confirmed on the chemical to add...
  -  **and** the chemical is an elemental metal, **then** the program should automatically suggest the tag "metals" [7]
  -  **and** the NFPA 704 diamond is present in PubChem, **and** there is a single highest number on the diamond, **then** the program should automatically suggest the corresponding tag (yellow, blue, red) [7]
  -  **then** the program allows the user to manually edit the molecule name, molecular formula, tags, GHS pictograms, GHS hazard statements, and NFPA 704 diamond information

# Given that the user is on the apparatuses tab
## ...and viewing multiple apparatuses
+ **When** the user has not put in any query filters, **then** the list of all apparatuses in the inventory is shown in alphabetical order [15][20]
+ **When** the user has put in a specific query filters (name / uncertainty for a measuring container / capacity for a measuring container, **then** the list of apparatuses matching such conditions is shown in alphabetical order [15][20]
## ...and viewing a single apparatus
+ **then** all the following items are shown to the user:
  - Name
  - Apparatus groups
  - Capacity (if a measuring container)
  - Uncertainty (if a measuring container)
  - Remaining amounts, shown in a list, where each item contains:
      + Amount of apparatus remaining
+ **when** the user changes the remaining number of a apparatus by: [13]
  - adding an apparatus with specific apparatus groups, capacity, and/or uncertainty...
      **then** a new apparatus should be:
        -  added to the inventory
        -  visible to the user
  - editing an apparatus's...
      + group/capacity/uncertainty, **then** the change should be:
          - reflected in the inventory
          - visible to the user
      + current remaining amount, **then** the change should be:
          - reflected in the inventory
          - visible to the user
  - deleting an apparatus, **then** the change should be: [14]
      - reflected in the inventory
      - visible to the user
+ **when** the user deletes an apparatus, **then** the change should be: [6]
      - reflected in the inventory
      - visible to the user
## ...and adding an apparatus [12]
+ **when** the user is typing the name, **and** apparatuses with matching or similar names exist, **then** the program should suggest autocomplete options
+ **when** the user has finished typing...
  - **then** the apparatus should be added
  - **and** apparatuses with matching names exist, **and** they have tags assigned to them, **then** automatically suggest these tags [16]

# Given that the user is on the inventories tab
+ **when** the user clicks "Save...", **then** an AKI-formatted inventory should be generated **and** available for download [17]
+ **when** the user clicks "Export to CSV...", **then** 2 CSV-formatted inventories should be generated **and** available for download [17]
+ **when** the user clicks "Open..." and selected an AKI-formatted inventory file...
  - **then** a side-by-side comparison with the current inventory loaded in memory is shown [21]
  - **when** the user confirms to open the inventory, **then** it should be loaded into memory [18]
+ **when** the user clicks "Import CSV..." and selected 2 CSV-formatted inventory files, **then** the inventory should be loaded into memory [18]
+ **when** the user clicks "New inventory..." and answers "yes" on a confirmation dialog, **then** the inventory object in memory should be reset

# Given that the user is on either the chemicals tab or the apparatuses tab
+ **when** the user tries to "undo" or "redo" an operation, **and** there are operations done on chemicals or apparatuses, **then** the program should react according to the user [19]

1.
2. √
3. √
4. √
5. √
6. √
7. √
8. √
9. √
10. √
11. √
12. √
13. √
14. √
15. √
16. √
17. √
18. √
19. √
20. √
21. √
