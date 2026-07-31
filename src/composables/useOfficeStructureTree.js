// src/composables/useOfficeStructureTree.js
//
// Builds an EDITABLE view-tree over the office structure JSON so a single
// recursive component (StructureTreeNode.vue) can render, add, rename, and
// remove any level: Office -> Sub-Office -> Group -> Division -> Section -> Unit.
//
// IMPORTANT: this never changes the underlying JSON schema. It's the exact
// shape officeStore.fetchOfficeStructure(office) already returns, and the
// exact shape Personnel Placement's structure panel / Edit Assignment modal
// already reads (rawStructure.office2[].group[].divisions[]/sections_without_division[]/
// units_without_division[], etc). Building it here means anything created in
// the Library structure editor shows up in Placement automatically.
//
// Flexibility ("office directly in section/unit/division/group"): office2 and
// group are always present as wrapper containers, but their *name* can be
// null. When a user adds e.g. a Division "directly" under an Office, we
// silently reuse (or create) the first unnamed office2/group wrapper instead
// of forcing them to name a Sub-Office/Group first. That keeps the JSON
// schema 100% valid while giving the "skip a level" UX you asked for.
//
// NULL LEVELS: Any level with a null name is automatically skipped in the
// display. So Office -> Sub-Office(null) -> Group(null) -> Division renders
// as Office -> Division. This gives a clean UI while maintaining schema
// compatibility.

export const LEVEL_META = {
  office: { label: 'Office', icon: 'business', color: 'primary' },
  office2: { label: 'Sub-Office', icon: 'business', color: 'teal' },
  group: { label: 'Group', icon: 'account_tree', color: 'indigo' },
  division: { label: 'Division', icon: 'corporate_fare', color: 'deep-orange' },
  section: { label: 'Section', icon: 'folder', color: 'brown' },
  unit: { label: 'Unit', icon: 'group_work', color: 'blue-grey' },
};

function emptyGroup(name = null) {
  return { group: name, divisions: [], sections_without_division: [], units_without_division: [] };
}

function emptyOffice2(name = null) {
  return { office2: name, group: [] };
}

function emptyDivision(name) {
  return { division: name, sections: [], units_without_section: [] };
}

function emptySection(name) {
  return { section: name, units: [] };
}

/** Find (or lazily create) the first "unnamed" wrapper in `arr` so shortcuts
 *  like "Add Division directly under Office" keep the schema valid without
 *  forcing the user to name every intermediate level. */
function firstOrCreateUnnamed(arr, key, factory) {
  let found = arr.find((entry) => !entry[key]);
  if (!found) {
    found = factory();
    arr.push(found);
  }
  return found;
}

function makeUnitNode(arr, index, markDirty, structureId = null) {
  // Get the item from the array
  const item = arr[index];

  // If item is an object with unit property, extract the name and structureId
  const name = typeof item === 'object' && item.unit !== undefined ? item.unit : item;
  const id =
    typeof item === 'object' && item.structureId !== undefined ? item.structureId : structureId;

  return {
    type: 'unit',
    name: name,
    structureId: id,
    childrenTypes: [],
    children: () => [],
    rename: (val) => {
      // If the item is an object, update its unit property
      if (typeof arr[index] === 'object' && arr[index].unit !== undefined) {
        arr[index] = { ...arr[index], unit: val };
      } else {
        arr[index] = val;
      }
      markDirty();
    },
    remove: () => {
      arr.splice(index, 1);
      markDirty();
    },
  };
}

function makeSectionNode(sectionObj, onRemove, markDirty, structureId = null) {
  return {
    type: 'section',
    name: sectionObj.section,
    structureId: structureId || sectionObj.structureId || null,
    childrenTypes: ['unit'],
    rename: (val) => {
      sectionObj.section = val;
      markDirty();
    },
    remove: onRemove,
    addChild: (type, name) => {
      if (type === 'unit') {
        // Store unit with structureId if available (for new units, it will be null)
        sectionObj.units.push(name);
        markDirty();
      }
    },
    children: () => {
      return sectionObj.units.map((unit, i) => {
        // Check if unit has a structureId (for flat data)
        const unitStructureId = typeof unit === 'object' ? unit.structureId : null;
        return makeUnitNode(sectionObj.units, i, markDirty, unitStructureId);
      });
    },
  };
}

function makeDivisionNode(divisionObj, onRemove, markDirty, structureId = null) {
  return {
    type: 'division',
    name: divisionObj.division,
    structureId: structureId || divisionObj.structureId || null,
    childrenTypes: ['section', 'unit'],
    rename: (val) => {
      divisionObj.division = val;
      markDirty();
    },
    remove: onRemove,
    addChild: (type, name) => {
      if (type === 'section') {
        divisionObj.sections.push(emptySection(name));
        markDirty();
      }
      if (type === 'unit') {
        divisionObj.units_without_section.push(name);
        markDirty();
      }
    },
    children: () => [
      ...divisionObj.sections.map((s, i) =>
        makeSectionNode(
          s,
          () => {
            divisionObj.sections.splice(i, 1);
            markDirty();
          },
          markDirty,
          s.structureId || null,
        ),
      ),
      ...divisionObj.units_without_section.map((unit, i) => {
        // Check if unit is object or string
        const unitStructureId = typeof unit === 'object' ? unit.structureId : null;
        return makeUnitNode(divisionObj.units_without_section, i, markDirty, unitStructureId);
      }),
    ],
  };
}

function makeGroupNode(groupObj, onRemove, markDirty, structureId = null) {
  return {
    type: 'group',
    name: groupObj.group,
    structureId: structureId || groupObj.structureId || null,
    childrenTypes: ['division', 'section', 'unit'],
    rename: (val) => {
      groupObj.group = val || null;
      markDirty();
    },
    remove: onRemove,
    addChild: (type, name) => {
      if (type === 'division') {
        groupObj.divisions.push(emptyDivision(name));
        markDirty();
      }
      if (type === 'section') {
        groupObj.sections_without_division.push(emptySection(name));
        markDirty();
      }
      if (type === 'unit') {
        groupObj.units_without_division.push(name);
        markDirty();
      }
    },
    children: () => {
      // If group has no name, skip it and return its children directly
      if (!groupObj.group) {
        const allChildren = [];

        groupObj.divisions.forEach((d, i) => {
          allChildren.push(
            makeDivisionNode(
              d,
              () => {
                groupObj.divisions.splice(i, 1);
                markDirty();
              },
              markDirty,
              d.structureId || null,
            ),
          );
        });

        groupObj.sections_without_division.forEach((s, i) => {
          allChildren.push(
            makeSectionNode(
              s,
              () => {
                groupObj.sections_without_division.splice(i, 1);
                markDirty();
              },
              markDirty,
              s.structureId || null,
            ),
          );
        });

        groupObj.units_without_division.forEach((unit, i) => {
          const unitStructureId = typeof unit === 'object' ? unit.structureId : null;
          allChildren.push(
            makeUnitNode(groupObj.units_without_division, i, markDirty, unitStructureId),
          );
        });

        return allChildren;
      }

      // Normal case: group has a name
      return [
        ...groupObj.divisions.map((d, i) =>
          makeDivisionNode(
            d,
            () => {
              groupObj.divisions.splice(i, 1);
              markDirty();
            },
            markDirty,
            d.structureId || null,
          ),
        ),
        ...groupObj.sections_without_division.map((s, i) =>
          makeSectionNode(
            s,
            () => {
              groupObj.sections_without_division.splice(i, 1);
              markDirty();
            },
            markDirty,
            s.structureId || null,
          ),
        ),
        ...groupObj.units_without_division.map((unit, i) => {
          const unitStructureId = typeof unit === 'object' ? unit.structureId : null;
          return makeUnitNode(groupObj.units_without_division, i, markDirty, unitStructureId);
        }),
      ];
    },
  };
}

function makeOffice2Node(office2Obj, onRemove, markDirty, structureId = null) {
  return {
    type: 'office2',
    name: office2Obj.office2,
    structureId: structureId || office2Obj.structureId || null,
    childrenTypes: ['group', 'division', 'section', 'unit'],
    rename: (val) => {
      office2Obj.office2 = val || null;
      markDirty();
    },
    remove: onRemove,
    addChild: (type, name) => {
      if (type === 'group') {
        office2Obj.group.push(emptyGroup(name));
        markDirty();
        return;
      }
      const g = firstOrCreateUnnamed(office2Obj.group, 'group', () => emptyGroup(null));
      if (type === 'division') {
        g.divisions.push(emptyDivision(name));
        markDirty();
      }
      if (type === 'section') {
        g.sections_without_division.push(emptySection(name));
        markDirty();
      }
      if (type === 'unit') {
        g.units_without_division.push(name);
        markDirty();
      }
    },
    children: () => {
      // If office2 has no name, skip it and return its group's children directly
      if (!office2Obj.office2) {
        const allChildren = [];

        office2Obj.group.forEach((g) => {
          // Skip group if it has no name - return its children directly
          if (!g.group) {
            // Flatten group children
            g.divisions.forEach((d, i) => {
              allChildren.push(
                makeDivisionNode(
                  d,
                  () => {
                    g.divisions.splice(i, 1);
                    markDirty();
                  },
                  markDirty,
                  d.structureId || null,
                ),
              );
            });

            g.sections_without_division.forEach((s, i) => {
              allChildren.push(
                makeSectionNode(
                  s,
                  () => {
                    g.sections_without_division.splice(i, 1);
                    markDirty();
                  },
                  markDirty,
                  s.structureId || null,
                ),
              );
            });

            g.units_without_division.forEach((unit, i) => {
              const unitStructureId = typeof unit === 'object' ? unit.structureId : null;
              allChildren.push(
                makeUnitNode(g.units_without_division, i, markDirty, unitStructureId),
              );
            });
          } else {
            allChildren.push(
              makeGroupNode(
                g,
                () => {
                  const index = office2Obj.group.indexOf(g);
                  if (index > -1) {
                    office2Obj.group.splice(index, 1);
                    markDirty();
                  }
                },
                markDirty,
                g.structureId || null,
              ),
            );
          }
        });

        return allChildren;
      }

      // Normal case: office2 has a name
      return office2Obj.group.map((g, i) =>
        makeGroupNode(
          g,
          () => {
            office2Obj.group.splice(i, 1);
            markDirty();
          },
          markDirty,
          g.structureId || null,
        ),
      );
    },
  };
}

/**
 * @param {{office:string, office2:Array}} structureObj - reactive structure object for ONE office
 * @param {Function} markDirty - called after every mutation (add/rename/remove)
 */
export function buildOfficeStructureTree(structureObj, markDirty) {
  return {
    type: 'office',
    name: structureObj.office,
    structureId: structureObj.structureId || null,
    childrenTypes: ['office2', 'group', 'division', 'section', 'unit'],
    remove: null, // the office node itself is managed by the basic Add/Edit Office dialogs
    addChild: (type, name) => {
      if (type === 'office2') {
        structureObj.office2.push(emptyOffice2(name));
        markDirty();
        return;
      }
      const o2 = firstOrCreateUnnamed(structureObj.office2, 'office2', () => emptyOffice2(null));
      if (type === 'group') {
        o2.group.push(emptyGroup(name));
        markDirty();
        return;
      }
      const g = firstOrCreateUnnamed(o2.group, 'group', () => emptyGroup(null));
      if (type === 'division') {
        g.divisions.push(emptyDivision(name));
        markDirty();
      }
      if (type === 'section') {
        g.sections_without_division.push(emptySection(name));
        markDirty();
      }
      if (type === 'unit') {
        g.units_without_division.push(name);
        markDirty();
      }
    },
    children: () => {
      // Skip office2 entries with null names
      const allChildren = [];

      structureObj.office2.forEach((o2) => {
        if (!o2.office2) {
          // Skip this office2 - flatten its groups
          o2.group.forEach((g) => {
            if (!g.group) {
              // Skip group too - flatten its children
              g.divisions.forEach((d, idx) => {
                allChildren.push(
                  makeDivisionNode(
                    d,
                    () => {
                      g.divisions.splice(idx, 1);
                      markDirty();
                    },
                    markDirty,
                    d.structureId || null,
                  ),
                );
              });

              g.sections_without_division.forEach((s, idx) => {
                allChildren.push(
                  makeSectionNode(
                    s,
                    () => {
                      g.sections_without_division.splice(idx, 1);
                      markDirty();
                    },
                    markDirty,
                    s.structureId || null,
                  ),
                );
              });

              g.units_without_division.forEach((unit, idx) => {
                const unitStructureId = typeof unit === 'object' ? unit.structureId : null;
                allChildren.push(
                  makeUnitNode(g.units_without_division, idx, markDirty, unitStructureId),
                );
              });
            } else {
              allChildren.push(
                makeGroupNode(
                  g,
                  () => {
                    const index = o2.group.indexOf(g);
                    if (index > -1) {
                      o2.group.splice(index, 1);
                      markDirty();
                    }
                  },
                  markDirty,
                  g.structureId || null,
                ),
              );
            }
          });
        } else {
          // Normal case: office2 has a name
          allChildren.push(
            makeOffice2Node(
              o2,
              () => {
                const index = structureObj.office2.indexOf(o2);
                if (index > -1) {
                  structureObj.office2.splice(index, 1);
                  markDirty();
                }
              },
              markDirty,
              o2.structureId || null,
            ),
          );
        }
      });

      return allChildren;
    },
  };
}

/** Starting point for an office that has no structure saved yet. */
export function emptyStructureFor(officeName) {
  return { office: officeName, office2: [] };
}
