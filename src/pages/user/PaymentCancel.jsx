import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { subscribeToPlanAPI, switchPlanAPI } from '../../services/subscriptionService'

function PaymentSuccess() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()

  const [status, setStatus]   = useState('processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const finalize = async () => {
      const planId     = searchParams.get('planId')
      const isSwitch   = searchParams.get('switch') === 'true'

      if (!planId) {
        setStatus('error')
        setMessage('Missing plan information. Please contact support.')
        return
      }

      try {
        if (isSwitch) {
          // Switch plan — send extraAmount as body
          const extraAmount = Number(searchParams.get('amount') || 0)
          await switchPlanAPI(Number(planId), extraAmount)
        } else {
          // New subscription
          await subscribeToPlanAPI(Number(planId))
        }
        setStatus('success')
        setMessage(
          isSwitch
            ? 'Your plan has been switched successfully!'
            : 'Your subscription is now active!'
        )
        // Redirect to subscription page after 3 seconds
        setTimeout(() => navigate('/subscription'), 3000)
      } catch (err) {
        setStatus('error')
        setMessage(
          err.response?.data?.message ||
          'Payment was received but subscription activation failed. Please contact support.'
        )
      }
    }
    finalize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        border: '1px solid var(--border)',
        padding: '48px', textAlign: 'center',
        maxWidth: '440px', width: '100%',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Processing */}
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: '22px',
              fontWeight: '700', color: 'var(--text-dark)', marginBottom: '10px',
            }}>
              Activating your subscription...
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--success-bg)', border: '2px solid var(--success-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 24px',
            }}>
              ✓
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: '22px',
              fontWeight: '700', color: 'var(--text-dark)', marginBottom: '10px',
            }}>
              Payment successful!
            </h2>
            <p style={{
              fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px',
            }}>
              {message}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              Redirecting to your subscription page...
            </p>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: '22px',
              fontWeight: '700', color: 'var(--text-dark)', marginBottom: '10px',
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px',
              lineHeight: '1.6',
            }}>
              {message}
            </p>
            <button
              onClick={() => navigate('/plans')}
              style={{
                padding: '12px 28px',
                background: 'var(--brand)', color: 'white',
                border: 'none', borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px', fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Back to plans
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess