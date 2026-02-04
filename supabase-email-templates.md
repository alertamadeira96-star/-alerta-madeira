# Alerta Madeira - Email Templates (Supabase)

Copy each template into Supabase Dashboard → **Authentication** → **Email Templates** → select the template type → paste and Save.

---

## 1. Confirm signup (Confirmar registo)

**Template type:** Confirm signup

**Subject:**
```
Confirme a sua conta Alerta Madeira
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar conta</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Alerta Madeira</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Proteja a sua comunidade</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Confirme o seu email</h2>
              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">Olá,</p>
              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">Obrigado por se registar no Alerta Madeira. Clique no botão abaixo para confirmar o seu endereço de email e ativar a sua conta.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Confirmar email</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.5;">Se não criou uma conta, pode ignorar este email.</p>
              <p style="margin: 16px 0 0 0; color: #888; font-size: 12px;">Ou copie e cole este link no browser:<br><a href="{{ .ConfirmationURL }}" style="color: #C41E3A; word-break: break-all;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background: #f9f9f9; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 12px; text-align: center;">© Alerta Madeira · Proteja a sua comunidade</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset password (Redefinir palavra-passe)

**Template type:** Reset password

**Subject:**
```
Redefinir palavra-passe - Alerta Madeira
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir palavra-passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Alerta Madeira</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Proteja a sua comunidade</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Redefinir palavra-passe</h2>
              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">Recebemos um pedido para redefinir a palavra-passe da sua conta Alerta Madeira. Clique no botão abaixo para criar uma nova palavra-passe.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Redefinir palavra-passe</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.5;">Se não fez este pedido, pode ignorar este email. A sua palavra-passe permanece inalterada.</p>
              <p style="margin: 16px 0 0 0; color: #888; font-size: 12px;">Ou copie e cole este link no browser:<br><a href="{{ .ConfirmationURL }}" style="color: #C41E3A; word-break: break-all;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background: #f9f9f9; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 12px; text-align: center;">© Alerta Madeira · Proteja a sua comunidade</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic link (Link de acesso)

**Template type:** Magic Link

**Subject:**
```
O seu link de acesso - Alerta Madeira
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link de acesso</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Alerta Madeira</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Proteja a sua comunidade</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Entrar na sua conta</h2>
              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">Clique no botão abaixo para aceder à sua conta Alerta Madeira de forma segura.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Entrar na conta</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.5;">Se não pediu este link, pode ignorar este email.</p>
              <p style="margin: 16px 0 0 0; color: #888; font-size: 12px;">Ou copie e cole este link no browser:<br><a href="{{ .ConfirmationURL }}" style="color: #C41E3A; word-break: break-all;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background: #f9f9f9; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 12px; text-align: center;">© Alerta Madeira · Proteja a sua comunidade</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## How to apply

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Select **Confirm signup** → paste the subject and body above → **Save**
3. Select **Reset password** → paste that template → **Save**
4. Select **Magic Link** (if used) → paste that template → **Save**

---

## Enable email confirmation

If confirmation is off:

1. Supabase → **Authentication** → **Providers** → **Email**
2. Turn **ON** "Confirm email"
3. Save
