// 统一 UI 组件导出层：BeUI 交互原语（手动 vendor 自 @beui）
export { Button, ButtonLink } from '@/components/motion/button'
export type { ButtonLinkProps, ButtonProps, ButtonSize, ButtonVariant } from '@/components/motion/button'
export { Loader } from '@/components/motion/loader'
export type { LoaderVariant } from '@/components/motion/loader'
export { Input } from '@/components/motion/input'
export { Switch } from '@/components/motion/switch'
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/motion/tabs'
export { BottomSheet } from '@/components/motion/bottom-sheet'
export { TiltCard } from '@/components/motion/tilt-card'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/motion/select'
export { AnimatedToastStack, useAnimatedToastStack } from '@/components/motion/animated-toast-stack'
export type {
  AnimatedToast,
  ToastInput,
  ToastPosition,
  ToastStatus,
} from '@/components/motion/animated-toast-stack'
