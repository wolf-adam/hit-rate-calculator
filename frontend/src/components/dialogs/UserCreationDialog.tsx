import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { createPlayer, getApiErrorMessage } from '../../data/api'
import type { PlayerOption } from '../../types'

type UserCreationDialogProps = {
  open: boolean
  onClose: () => void
  onCreated: (player: PlayerOption) => void
}

function UserCreationDialog({ open, onClose, onCreated }: UserCreationDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setFirstName('')
    setLastName('')
    setError('')
  }, [open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const first_name = firstName.trim()
    const last_name = lastName.trim()
    if (!first_name || !last_name) {
      setError('Enter both a first and last name.')
      return
    }

    setSaving(true)
    setError('')
    try {
      onCreated(await createPlayer({ first_name, last_name }))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not add this user.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={(event) => void handleSubmit(event)}>
        <DialogTitle>Add new user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoFocus
              required
              fullWidth
              label="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              inputProps={{ maxLength: 120 }}
              disabled={saving}
            />
            <TextField
              required
              fullWidth
              label="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              inputProps={{ maxLength: 240 }}
              disabled={saving}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Adding…' : 'Add user'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default UserCreationDialog
