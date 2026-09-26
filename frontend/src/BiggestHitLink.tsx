import {
  Box,
  Link,
  Tooltip,
} from '@mui/material'
import { formatBiggestHitLink } from './utils'

type BiggestHitLinkProps = {
  href: string
  imageSrc: string | null
}

function BiggestHitLink({ href, imageSrc }: BiggestHitLinkProps) {
  const label = formatBiggestHitLink(href)

  return (
    <Tooltip
      title={imageSrc ? (
        <Box
          component="img"
          className="biggest-hit-preview-image"
          src={imageSrc}
          alt={label}
        />
      ) : ''}
      placement="left"
      enterDelay={300}
      disableHoverListener={!imageSrc}
      slotProps={{ tooltip: { className: 'biggest-hit-preview' } }}
    >
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </Link>
    </Tooltip>
  )
}

export default BiggestHitLink