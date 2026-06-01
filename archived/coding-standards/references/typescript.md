# TypeScript / React 代码规范事实文档

记录用户认可的 TypeScript / React 编码规范事实；每条只保留反例、规范写法和一句话理由，避免占用过多上下文。

追加新规范时使用：

````markdown
## TS-编号：简短标题

**反例**：

```tsx
// 反例
```

**规范**：

```tsx
// 推荐写法
```

**理由**：一句话说明为什么不能这么做或为什么要这么做。
````

## TS-001：函数和 React 组件必须使用箭头函数

**反例**：

```tsx
function formatPrice(value: number): string {
  return value.toFixed(2);
}

function Desktop({ opened, onClose, onPurchaseSuccess }: DesktopVideoGenerationPaymentModalProps) {
  return null;
}
```

**规范**：

```tsx
const formatPrice = (value: number): string => {
  return value.toFixed(2);
};

const Desktop: React.FC<DesktopVideoGenerationPaymentModalProps> = ({
  opened,
  onClose,
  onPurchaseSuccess,
}) => {
  return null;
};
```

**理由**：公司 TypeScript / React 命名风格要求函数和组件统一用 `const` 箭头函数声明，避免同一代码库混用多种函数写法。
