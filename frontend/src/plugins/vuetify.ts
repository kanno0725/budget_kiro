import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#ea580c', // オレンジ
          secondary: '#6b7280',
          accent: '#fed7aa',
          error: '#dc2626',
          warning: '#f59e0b',
          info: '#3b82f6',
          success: '#16a34a',
        },
      },
    },
  },
})
