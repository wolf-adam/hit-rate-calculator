import {
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectProps,
} from '@mui/material'
import { useId } from 'react'
import { productColors } from '../../constants'
import type { ProductOption } from '../../types'
import './ProductSelect.scss'

type ProductSelectProps = {
  products: ProductOption[]
  value: number | string
  onChange: (value: string) => void
  className?: string
  fullWidth?: boolean
  label?: string
  'aria-label': string
}

function ProductSelect({
  products,
  value,
  onChange,
  className,
  fullWidth,
  label = 'Product',
  'aria-label': ariaLabel,
}: ProductSelectProps) {
  const labelId = useId()
  const getProduct = (productId: unknown) => products.find(
    (product) => String(product.id) === String(productId),
  )

  const renderProduct = (product: ProductOption) => {
    const productIndex = products.findIndex((option) => option.id === product.id)

    return (
      <Chip
        label={product.name}
        color={productColors[productIndex % productColors.length]}
        size="small"
      />
    )
  }

  return (
    <FormControl className={className} fullWidth={fullWidth}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(String(event.target.value))}
        displayEmpty
        renderValue={(selected: SelectProps['value']) => {
          const product = getProduct(selected)
          return product ? (
            <span className="product-select-value">{renderProduct(product)}</span>
          ) : (
            <span className="product-select-placeholder">Select product</span>
          )
        }}
      >
        <MenuItem value="" disabled>Select product</MenuItem>
        {products.map((product) => (
          <MenuItem key={product.id} value={product.id}>
            {renderProduct(product)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default ProductSelect