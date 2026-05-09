<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Set New Password — Ridgeline</title>
  <link rel="stylesheet" href="${url.resourcesPath}/css/ridgeline.css">
</head>
<body>
<div class="auth-shell">

  <div class="auth-header">
    <svg class="auth-mountains" viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f0a030" d="M0,160 L180,60 L300,110 L480,20 L620,90 L780,10 L920,80 L1080,30 L1220,100 L1440,40 L1440,160 Z"/>
    </svg>
    <div class="auth-brand"><span class="auth-brand-text">RIDGELINE</span></div>
  </div>

  <main class="auth-main">
    <form class="auth-form" action="${url.loginAction}" method="post">

      <h1>Set New Password</h1>
      <#if auth?? && auth.showUsername && auth.attemptedUsername?has_content>
        <p class="subtitle">${auth.attemptedUsername}</p>
        <input type="text" name="username" value="${auth.attemptedUsername}"
               autocomplete="username" style="display:none">
      </#if>

      <#if message?has_content>
        <div class="auth-alert ${message.type}">${message.summary}</div>
      </#if>

      <div class="field">
        <label for="password-new">New Password</label>
        <input id="password-new" name="password-new" type="password"
               autocomplete="new-password" autofocus>
        <#if messagesPerField?? && messagesPerField.existsError('password-new')>
          <span class="field-error">${messagesPerField.get('password-new')}</span>
        </#if>
      </div>

      <div class="field">
        <label for="password-confirm">Confirm New Password</label>
        <input id="password-confirm" name="password-confirm" type="password"
               autocomplete="new-password">
        <#if messagesPerField?? && messagesPerField.existsError('password-confirm')>
          <span class="field-error">${messagesPerField.get('password-confirm')}</span>
        </#if>
      </div>

      <button type="submit">Set Password</button>

    </form>
  </main>

  <div class="auth-footer">
    <svg class="auth-footer-mountains" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f0a030" d="M0,100 L160,40 L280,70 L440,10 L580,55 L720,5 L860,50 L1020,20 L1180,65 L1340,25 L1440,60 L1440,100 Z"/>
    </svg>
  </div>

</div>
</body>
</html>