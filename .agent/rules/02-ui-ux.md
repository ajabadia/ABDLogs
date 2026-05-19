# UI/UX Standards (Tailwind 4 + Shadcn)

## 🎨 System
- **Engine**: Tailwind CSS 4
- **Components**: Shadcn UI (Radix-based)
- **Icons**: Lucide React
- **Notifications**: Sonner

## ⚖️ Laws
1. **Mobile First**: Diseña para móviles primero, luego escala.
2. **i18n Standard**: Prohibido literales hardcodeados. Usa `next-intl`.
3. **Accessibility (a11y)**: Navegación por teclado, labels semánticos y soporte ARIA obligatorio.
4. **Fire Rule: Centralized Styles**: Prohibido definir estilos locales. Usa tokens globales y el orquestador de estilos.
5. **Native Dark/Light**: Soporte nativo para ambos modos desde el inicio.
6. **Visual Feedback**: Usa Toasts (Sonner) para cada acción de mutación.
7. **Performance**: Usa `next/dynamic` para componentes pesados.
5. **No Placeholders**: Genera imágenes o usa iconos reales.
