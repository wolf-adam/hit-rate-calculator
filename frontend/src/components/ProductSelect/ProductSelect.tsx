import {
  Autocomplete,
  Chip,
  TextField,
} from '@mui/material'
import { productColors } from '../../config/constants'
import type { ProductOption } from '../../types'
import './ProductSelect.scss'

type ProductSelectProps = {
  products: ProductOption[]
  value: number | string
  onChange: (value: string) => void
  className?: string
  fullWidth?: boolean
  label?: string
  disabled?: boolean
  'aria-label': string
}

function ProductSelect({
  products,
  value,
  onChange,
  className,
  fullWidth,
  label = 'Product',
  disabled = false,
  'aria-label': ariaLabel,
}: ProductSelectProps) {
  const selectedProduct = products.find(
    (product) => String(product.id) === String(value),
  ) ?? null

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
    <Autocomplete
      className={className}
      fullWidth={fullWidth}
      disabled={disabled}
      options={products}
      value={selectedProduct}
      onChange={(_, product) => onChange(product ? String(product.id) : '')}
      getOptionLabel={(product) => product.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderOption={(props, product) => (
        <li {...props} key={product.id}>
          {renderProduct(product)}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required
          inputProps={{ ...params.inputProps, 'aria-label': ariaLabel }}
        />
      )}
      noOptionsText="No matching products"
    />
  )
}

export default ProductSelect
