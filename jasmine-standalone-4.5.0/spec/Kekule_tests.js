/* eslint-disable no-undef */
'use strict';
// Change 'xdescribe' and 'xit' to 'describe' and 'it' to enable tests

// Dynamically import modules

/**
 * 
 * @param {string} path The path of the module.
 * @param {object} place The variable to store the input to.
 */

// app_core/kekule
var K;
import("../../app_core/kekule.mjs").then((ns)=>{K=ns;}).catch(()=>{throw EvalError("Failed to import app_core/kekule.mjs for testing")});

xdescribe("Given that the user is on the chemicals tab...", function(){

    xdescribe("...and viewing multiple chemicals", function(){

        xit("When the user has not put in any query filters, then the list of all chemicals in the inventory is shown in alphabetical order", function(){
            fail("Not implemented");
        });


        xit("When the user has put in a specific chemical group and/or a search term (name / molecular formula / concentration of an aqueous solution), then the list of chemicals matching such conditions is shown in alphabetical order", function(){
            fail("Not implemented");
        });
    });
    
    xdescribe("...and viewing a single chemical", function(){
        xdescribe("then all the following items are shown to the user: ", function(){
            xit("Name", function(){
                fail("Not implemented");
            });

            xit("Molecular formula", function(){
                fail("Not implemented");
            });

            xit("Chemical groups", function(){
                fail("Not implemented");
            });

            xdescribe("Remaining amounts, shown in a list, where each item contains: ", function(){
                xit("Container size", function(){
                    fail("Not implemented");
                });

                xit("Current remaining amount in that container", function(){
                    fail("Not implemented");
                });
            });

            xit("2D structure", function(){
                fail("Not implemented");
            });

            xit("GHS pictograms", function(){
                fail("Not implemented");
            });

            xit("GHS hazard statements", function(){
                fail("Not implemented");
            });

            xit("NFPA 704 diamond", function(){
                fail("Not implemented");
            });

            xit("Material Safety Data Sheet", function(){
                fail("Not implemented");
            });

            xit("Waste disposal methods", function(){
                fail("Not implemented");
            });
        });

        xdescribe("when the user changes the remaining amount of a chemical by: ", function(){
            xdescribe("adding a container with a specific size…", function(){
                xdescribe("and providing a current remaining amount for that container, then a new container with the specified current remaining amount should be: ", function(){
                    xit("added to the inventory", function(){
                        fail("Not implemented");
                    });

                    xit("visible to the user", function(){
                        fail("Not implemented");
                    });
                });

                xdescribe("without providing a current remaining amount for that container, then a new container with the default current remaining amount of 0 g should be:", function(){
                    xit("added to the inventory", function(){
                        fail("Not implemented");
                    });

                    xit("visible to the user", function(){
                        fail("Not implemented");
                    });
                });
            });

            xdescribe("editing a container's…", function(){
                xdescribe("size, then the change should be: ", function(){
                    xit("reflected in the inventory", function(){
                        fail("Not implemented");
                    });

                    xit("visible to the user", function(){
                        fail("Not implemented");
                    });
                });

                xdescribe("current remaining amount, then the change should be: ", function(){
                    xit("reflected in the inventory", function(){
                        fail("Not implemented");
                    });

                    xit("visible to the user", function(){
                        fail("Not implemented");
                    });
                });
            });

            xdescribe("deleting a container, then the change should be:", function(){
                xit("reflected in the inventory", function(){
                    fail("Not implemented");
                });

                xit("visible to the user", function(){
                    fail("Not implemented");
                });
            });
        });

        xdescribe("when the user deletes a chemical, then the change should be: ", function(){
            xit("reflected in the inventory", function(){
                fail("Not implemented");
            });

            xit("visible to the user", function(){
                fail("Not implemented");
            });
        });

        xdescribe("when the user replaces a chemical (by choosing a different name / molecular formula), then the change should be: ", function(){
            xit("reflected in the inventory", function(){
                fail("Not implemented");
            });

            xit("visible to the user", function(){
                fail("Not implemented");
            });
        });
    });

    xdescribe("…and adding a chemical", function(){
        xit("when the user is typing the name or molecular formula, then the program should suggest autocomplete options", function(){
            fail("Not implemented");
        });

        xit("when the user has finished typing, then a list of matching chemicals should be shown to the user", function(){
            fail("Not implemented");
        });

        xdescribe("when the user has confirmed on the chemical to add…", function(){
            xit("and the chemical is an elemental metal, then the program should automatically suggest the tag “metals”", function(){
                fail("Not implemented");
            });

            xit("and the NFPA 704 diamond is present in PubChem, and there is a single highest number on the diamond, then the program should automatically suggest the corresponding tag (yellow, blue, red)", function(){
                fail("Not implemented");
            });

            xit("then the program allows the user to manually edit the molecule name, molecular formula, tags, GHS pictograms, GHS hazard statements, and NFPA 704 diamond information", function(){
                fail("Not implemented");
            });
        });
    });
});



xdescribe("Given that the user is on the apparatuses tab", function(){
    xdescribe("…and viewing multiple apparatuses", function(){
        xit("When the user has not put in any query filters, then the list of all apparatuses in the inventory is shown in alphabetical order", function(){
            fail("Not implemented");
        });

        xit("When the user has put in a specific query filters (name / uncertainty for a measuring container / capacity for a measuring container, then the list of apparatuses matching such conditions is shown in alphabetical order", function(){
            fail("Not implemented");
        });
    });

    xdescribe("…and viewing a single apparatus", function(){
        xdescribe("then all the following items are shown to the user: ", function(){
            xit("Name", function(){
                fail("Not implemented");
            });

            xit("Apparatus groups", function(){
                fail("Not implemented");
            });

            xit("Capacity (if a measuring container)", function(){
                fail("Not implemented");
            });

            xit("Uncertainty (if a measuring container)", function(){
                fail("Not implemented");
            });

            xdescribe("Remaining amounts, shown in a list, where each item contains: ", function(){
                xit("Amount of apparatus remaining", function(){
                    fail("Not implemented");
                });
            });
        });

        xdescribe("when the user changes the remaining number of a apparatus by: ", function(){
            xdescribe("adding an apparatus with specific apparatus groups, capacity, and/or uncertainty… then a new apparatus should be: ", function(){
                xit("added to the inventory", function(){
                    fail("Not implemented");
                });

                xit("visible to the user", function(){
                    fail("Not implemented");
                });
            });

            xdescribe("editing an apparatus's…", function(){
                xdescribe("group/capacity/uncertainty, then the change should be: ", function(){
                    xit("reflected in the inventory", function(){
                        fail("Not implemented");
                    });
    
                    xit("visible to the user", function(){
                        fail("Not implemented");
                    });
                });

                xdescribe("current remaining amount, then the change should be: ", function(){
                    xit("reflected in the inventory", function(){
                        fail("Not implemented");
                    });
    
                    xit("visible to the user", function(){
                        fail("Not implemented");
                    });
                });
            });

            xdescribe("deleting an apparatus, then the change should be: ", function(){
                xit("reflected in the inventory", function(){
                    fail("Not implemented");
                });

                xit("visible to the user", function(){
                    fail("Not implemented");
                });
            });
        });

        xdescribe("when the user deletes an apparatus, then the change should be: ", function(){
            xit("reflected in the inventory", function(){
                fail("Not implemented");
            });

            xit("visible to the user", function(){
                fail("Not implemented");
            });
        });
    });

    xdescribe("…and adding an apparatus", function(){
        xit("when the user is typing the name, and apparatuses with matching or similar names exist, then the program should suggest autocomplete options", function(){
            fail("Not implemented");
        });

        xdescribe("when the user has finished typing…", function(){
            xit("then the apparatus should be added", function(){
                fail("Not implemented");
            });

            xit("and apparatuses with matching names exist, and they have tags assigned to them, then automatically suggest these tags", function(){
                fail("Not implemented");
            });
        });
    });
});



xdescribe("Given that the user is on the inventories tab", function(){
    xit("when the user clicks “Save…”, then an AKI-formatted inventory should be generated and available for download", function(){
        fail("Not implemented");
    });

    xit("when the user clicks “Export to CSV…”, then 2 CSV-formatted inventories should be generated and available for download", function(){
        fail("Not implemented");
    });

    xdescribe("when the user clicks “Open…” and selected an AKI-formatted inventory file…", function(){
        xit("then a side-by-side comparison with the current inventory loaded in memory is shown", function(){
            fail("Not implemented");
        });

        xit("when the user confirms to open the inventory, then it should be loaded into memory", function(){
            fail("Not implemented");
        });
    });

    xit("when the user clicks “Import CSV…” and selected 2 CSV-formatted inventory files, then the inventory should be loaded into memory", function(){
        fail("Not implemented");
    });

    xit("when the user clicks “New inventory…” and answers “yes” on a confirmation dialog, then the inventory object in memory should be reset", function(){
        fail("Not implemented");
    });
});



describe("Given that the user is on either the chemicals tab or the apparatuses tab", function(){
    it("when the user tries to “undo” or “redo” an operation, and there are operations done on chemicals or apparatuses, then the program should react according to the user", function(){
        fail("Not implemented");
    });
});
