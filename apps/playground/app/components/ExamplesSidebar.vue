<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  isOpen?: boolean
}>()

const emit = defineEmits<{
  select: [example: { format: 'hex' | 'ur', value: string }]
  close: []
}>()

const examples: NavigationMenuItem[] = [
  {
    label: 'Examples',
    type: 'label'
  },
  {
    label: 'Simple Object',
    icon: 'i-heroicons-cube',
    onSelect: () => {
      emit('select', {
        format: 'hex',
        value: 'a2626964187b646e616d65684a6f686e20446f65'
      })
      emit('close')
    }
  },
  {
    label: 'Collection',
    icon: 'i-heroicons-rectangle-stack',
    onSelect: () => {
      emit('select', {
        format: 'hex',
        value: 'a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74'
      })
      emit('close')
    }
  },
  {
    label: 'UR Link',
    icon: 'i-heroicons-link',
    onSelect: () => {
      emit('select', {
        format: 'ur',
        value: 'ur:link3/pdihjzinjtjejklyoeiakpjpjzksdtisjyjyjojkftdldlktktktdmjzinjtjeihieinjtdmiajljndlinjtdljzihjlioiakpjkjyjlieinjldlihjyinjyjzihisgsinjtjeihiegajtihjyisihjnihjeiehsjpjedpiyjljpihjkjyihjyinjyjzihjsfzjzihjljthsjpiejliakpjkjyjlieinjliyhskohsjyhsjpksfeinjoiyjkftdldlidhsiyjeeyidknhsiaihiaidkoimkshsimjpjlideyiojojlecjnjseejojseeidemjsidkojsjyjeiaenjseckkemjnjtjyisktjejpieimhseyisjojpenjsjkimjokpidjziniahejeihkkynimjyinjyjzihheiyjljtjyiofygtcxguhsjtjkimjyinjyjzihhejkinknihihjkjnhsjzjzjejyinjyjzihheiajljzjljpiocnfgfgfgfgfgfgvwylneoe'
      })
      emit('close')
    }
  }
]
</script>

<template>
  <!-- Desktop: Always visible sidebar -->
  <aside class="hidden lg:block w-48 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
    <div class="p-4">
      <UNavigationMenu
        :items="examples"
        orientation="vertical"
        color="primary"
        variant="pill"
        class="w-full"
      />
    </div>
  </aside>

  <!-- Mobile: Overlay sidebar -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="lg:hidden fixed inset-0 bg-black/50 z-40"
        role="button"
        tabindex="0"
        aria-label="Close sidebar"
        @click="emit('close')"
        @keydown.escape="emit('close')"
      />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isOpen"
        class="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-50 overflow-y-auto"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-white">Menu</h2>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-heroicons-x-mark"
            aria-label="Close menu"
            @click="emit('close')"
          />
        </div>
        <div class="p-4">
          <UNavigationMenu
            :items="examples"
            orientation="vertical"
            color="primary"
            variant="pill"
            class="w-full"
          />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
