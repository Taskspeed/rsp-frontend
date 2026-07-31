<template>
  <div class="structure-node">
    <div class="node-row row items-center no-wrap" :class="`node-row--${node.type}`">
      <q-btn
        v-if="childNodes.length"
        flat
        dense
        round
        size="sm"
        :icon="expanded ? 'expand_more' : 'chevron_right'"
        @click="expanded = !expanded"
        class="expand-btn"
      />
      <div v-else class="expand-spacer" />

      <q-icon :name="meta.icon" :color="meta.color" size="18px" class="q-mr-sm" />

      <div
        class="node-name"
        :class="{
          'node-name--placeholder': !node.name,
          'node-name--editable': !readOnly && node.rename,
          'node-name--readonly': readOnly,
        }"
      >
        {{ node.name || placeholder }}
        <q-popup-edit
          v-if="!readOnly && node.rename && node.structureId"
          :model-value="node.name"
          v-slot="scope"
          @save="(val) => handleRename(scope, val)"
        >
          <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set" />
        </q-popup-edit>
        <span
          v-else-if="!readOnly && node.rename && !node.structureId"
          class="text-caption text-grey-5"
        >
          (new - will be saved with structure)
        </span>
      </div>

      <q-badge v-if="node.type !== 'unit'" outline color="grey-6" dense class="q-ml-sm">
        {{ meta.label }}
      </q-badge>
      <q-badge v-if="childNodes.length" color="grey-4" text-color="grey-9" dense class="q-ml-xs">
        {{ childNodes.length }}
      </q-badge>

      <q-space />

      <template v-if="!readOnly">
        <q-btn
          v-if="node.childrenTypes && node.childrenTypes.length"
          flat
          dense
          round
          size="sm"
          icon="add"
          color="primary"
          class="q-mr-xs"
        >
          <q-tooltip>Add sub-level</q-tooltip>
          <q-menu anchor="bottom right" self="top right">
            <q-list dense style="min-width: 190px">
              <q-item
                v-for="childType in node.childrenTypes"
                :key="childType"
                clickable
                v-close-popup
                @click="promptAdd(childType)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="LEVEL_META[childType].icon"
                    :color="LEVEL_META[childType].color"
                    size="16px"
                  />
                </q-item-section>
                <q-item-section>Add {{ LEVEL_META[childType].label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn
          v-if="node.remove"
          flat
          dense
          round
          size="sm"
          icon="delete"
          color="negative"
          @click="confirmDelete"
        >
          <q-tooltip>Remove {{ meta.label }}</q-tooltip>
        </q-btn>
      </template>
    </div>

    <!-- Add-node prompt -->
    <q-dialog v-model="addDialogOpen">
      <q-card style="width: 380px; max-width: 92vw; border-radius: 10px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon
            :name="pendingType ? LEVEL_META[pendingType].icon : ''"
            :color="pendingType ? LEVEL_META[pendingType].color : 'primary'"
          />
          <div class="text-subtitle1 text-bold">
            Add {{ pendingType ? LEVEL_META[pendingType].label : '' }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="text-caption text-grey-7 q-mb-sm">Under: {{ node.name || meta.label }}</div>
          <q-input
            v-model="pendingName"
            outlined
            dense
            autofocus
            :label="(pendingType ? LEVEL_META[pendingType].label : '') + ' name *'"
            @keyup.enter="confirmAdd"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Add"
            color="primary"
            :disable="!pendingName.trim()"
            @click="confirmAdd"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div v-if="expanded && childNodes.length" class="node-children">
      <structure-tree-node
        v-for="(child, idx) in childNodes"
        :key="node.type + '-' + child.type + '-' + idx + '-' + (child.structureId || 'new')"
        :node="child"
        :read-only="readOnly"
        :structure-id-map="structureIdMap"
        @update-structure-item="(id, fields) => $emit('update-structure-item', id, fields)"
        @delete-structure-item="(id) => $emit('delete-structure-item', id)"
        @structure-changed="(type) => $emit('structure-changed', type)"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { useQuasar } from 'quasar';
  import { LEVEL_META } from 'src/composables/useOfficeStructureTree';

  const props = defineProps({
    node: { type: Object, required: true },
    readOnly: { type: Boolean, default: false },
    structureIdMap: { type: Object, default: () => ({}) },
  });

  const emit = defineEmits(['update-structure-item', 'delete-structure-item', 'structure-changed']);

  const $q = useQuasar();
  const expanded = ref(true);
  const addDialogOpen = ref(false);
  const pendingType = ref(null);
  const pendingName = ref('');
  const isProcessing = ref(false);

  const meta = computed(
    () => LEVEL_META[props.node.type] || { label: props.node.type, icon: 'label', color: 'grey' },
  );

  const placeholder = computed(() => `Unnamed ${meta.value.label}`);

  const childNodes = computed(() => (props.node.children ? props.node.children() : []));

  function promptAdd(type) {
    pendingType.value = type;
    pendingName.value = '';
    addDialogOpen.value = true;
  }

  function confirmAdd() {
    const name = pendingName.value.trim();
    if (!name) return;
    props.node.addChild(pendingType.value, name);
    expanded.value = true;
    addDialogOpen.value = false;
    emit('structure-changed', 'added');
  }

  // Modified to handle the scope properly
  async function handleRename(scope, newName) {
    if (!newName || !newName.trim()) return;

    const trimmedName = newName.trim();

    console.log('handleRename called:', {
      nodeType: props.node.type,
      nodeName: props.node.name,
      structureId: props.node.structureId,
      newName: trimmedName,
    });

    // If node has a structureId, update it via API
    if (props.node.structureId) {
      try {
        isProcessing.value = true;
        const fieldName = props.node.type;
        const updateData = {
          [fieldName]: trimmedName,
        };

        console.log('Emitting update-structure-item:', props.node.structureId, updateData);

        // Emit the update event and wait for it
        await emit('update-structure-item', props.node.structureId, updateData);

        // Update the local node name
        if (props.node.rename) {
          props.node.rename(trimmedName);
        }

        // Emit structure-changed event with 'updated' type
        emit('structure-changed', 'updated');

        // Notify success
        $q.notify({
          type: 'positive',
          message: `${meta.value.label} renamed successfully`,
          position: 'top',
          timeout: 2000,
        });
      } catch (error) {
        console.error('Failed to rename:', error);

        // Revert the name change in the scope
        scope.value = props.node.name;

        $q.notify({
          type: 'negative',
          message: 'Failed to rename. Please try again.',
          position: 'top',
        });
      } finally {
        isProcessing.value = false;
      }
    } else {
      // New node (no structureId yet) - just update locally
      if (props.node.rename) {
        props.node.rename(trimmedName);
        emit('structure-changed', 'added');
      }
    }
  }

  function confirmDelete() {
    $q.dialog({
      title: `Remove ${meta.value.label}`,
      message: `Remove "${props.node.name || placeholder.value}"? Everything nested under it will be removed too.`,
      cancel: true,
      persistent: true,
      ok: { color: 'negative', label: 'Remove' },
    }).onOk(async () => {
      console.log('confirmDelete called:', {
        nodeType: props.node.type,
        nodeName: props.node.name,
        structureId: props.node.structureId,
      });

      // If node has a structureId, delete it via API
      if (props.node.structureId) {
        try {
          isProcessing.value = true;
          console.log('Emitting delete-structure-item:', props.node.structureId);
          await emit('delete-structure-item', props.node.structureId);
          // Remove from local tree
          if (props.node.remove) {
            props.node.remove();
          }
          emit('structure-changed', 'deleted');

          $q.notify({
            type: 'positive',
            message: `${meta.value.label} removed successfully`,
            position: 'top',
            timeout: 2000,
          });
        } catch (error) {
          console.error('Failed to delete:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to delete. Please try again.',
            position: 'top',
          });
        } finally {
          isProcessing.value = false;
        }
      } else {
        // New node (no structureId yet) - just remove locally
        if (props.node.remove) {
          props.node.remove();
          emit('structure-changed', 'deleted');
        }
      }
    });
  }
</script>

<style scoped>
  .structure-node {
    position: relative;
  }

  .node-row {
    padding: 6px 4px;
    border-radius: 6px;
    min-height: 36px;
  }

  .node-row:hover {
    background: #f5f7fa;
  }

  .expand-btn {
    flex-shrink: 0;
  }

  .expand-spacer {
    width: 28px;
    flex-shrink: 0;
  }

  .node-name {
    font-size: 13.5px;
    font-weight: 600;
    color: #3a4550;
  }

  .node-name--editable {
    cursor: pointer;
    border-bottom: 1px dashed transparent;
  }

  .node-name--editable:hover {
    border-bottom-color: #c0c8d0;
  }

  .node-name--readonly {
    cursor: default;
    opacity: 0.85;
  }

  .node-name--placeholder {
    font-style: italic;
    font-weight: 400;
    color: #9aa4ae;
  }

  .node-children {
    margin-left: 24px;
    padding-left: 12px;
    border-left: 2px dashed #e4e8ec;
  }

  .node-row--unit .node-name {
    font-weight: 500;
  }

  .node-row--unit .node-name--editable {
    font-weight: 500;
  }
</style>
