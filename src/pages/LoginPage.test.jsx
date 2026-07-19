import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'

const navigateMock = vi.fn()
const signInMock = vi.fn()
let authState

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => authState,
}))

beforeEach(() => {
  vi.clearAllMocks()
  authState = { signIn: signInMock, profile: null }
})

describe('LoginPage', () => {
  it('désactive le bouton de connexion tant que les champs sont vides', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeDisabled()
  })

  it('appelle signIn avec les identifiants saisis', async () => {
    signInMock.mockResolvedValue({})
    render(<LoginPage />)

    await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'sara.benali@pharmagest.local')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'motdepasse')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(signInMock).toHaveBeenCalledWith('sara.benali@pharmagest.local', 'motdepasse')
  })

  it("affiche un message d'erreur générique si signIn échoue", async () => {
    signInMock.mockRejectedValue(new Error('invalid_grant'))
    render(<LoginPage />)

    await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'sara.benali@pharmagest.local')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'mauvais')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(await screen.findByText('Identifiant ou mot de passe incorrect')).toBeInTheDocument()
  })

  it('redirige sans planter quand un profil est déjà chargé (pas de mise à jour pendant le rendu)', async () => {
    authState = { signIn: signInMock, profile: { role: 'assistante' } }
    const { container } = render(<LoginPage />)

    // Le rendu ne doit rien afficher (redirection en cours) et ne doit pas lever
    // "Cannot update a component while rendering a different component".
    expect(container).toBeEmptyDOMElement()
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/assistante', { replace: true }))
  })

  it('redirige vers /responsable pour un profil responsable', async () => {
    authState = { signIn: signInMock, profile: { role: 'responsable' } }
    render(<LoginPage />)

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/responsable', { replace: true }))
  })
})
