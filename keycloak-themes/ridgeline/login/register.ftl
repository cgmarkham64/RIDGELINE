<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Create Account — Ridgeline</title>
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
    <form class="auth-form" action="${url.registrationAction}" method="post">

      <h1>Create Account</h1>

      <#if message?has_content>
        <div class="auth-alert ${message.type}">${message.summary}</div>
      </#if>

      <div class="field-row">
        <div class="field">
          <label for="firstName">First Name</label>
          <input id="firstName" name="firstName" type="text"
                 value="${(register.firstName!'')}"
                 autocomplete="given-name"
                 autofocus>
          <#if messagesPerField?? && messagesPerField.existsError('firstName')>
            <span class="field-error">${messagesPerField.get('firstName')}</span>
          </#if>
        </div>
        <div class="field">
          <label for="lastName">Last Name</label>
          <input id="lastName" name="lastName" type="text"
                 value="${(register.lastName!'')}"
                 autocomplete="family-name">
          <#if messagesPerField?? && messagesPerField.existsError('lastName')>
            <span class="field-error">${messagesPerField.get('lastName')}</span>
          </#if>
        </div>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email"
               value="${(register.email!'')}"
               autocomplete="email">
        <#if messagesPerField?? && messagesPerField.existsError('email')>
          <span class="field-error">${messagesPerField.get('email')}</span>
        </#if>
      </div>

      <#if !realm.registrationEmailAsUsername>
        <div class="field">
          <label for="username">Username</label>
          <input id="username" name="username" type="text"
                 value="${(register.username!'')}"
                 autocomplete="username">
          <#if messagesPerField?? && messagesPerField.existsError('username')>
            <span class="field-error">${messagesPerField.get('username')}</span>
          </#if>
        </div>
      </#if>

      <#if passwordRequired??>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="new-password">
          <#if messagesPerField?? && messagesPerField.existsError('password')>
            <span class="field-error">${messagesPerField.get('password')}</span>
          </#if>
        </div>
        <div class="field">
          <label for="password-confirm">Confirm Password</label>
          <input id="password-confirm" name="password-confirm" type="password" autocomplete="new-password">
          <#if messagesPerField?? && messagesPerField.existsError('password-confirm')>
            <span class="field-error">${messagesPerField.get('password-confirm')}</span>
          </#if>
        </div>
      </#if>

      <button type="submit">Create Account</button>

      <div class="links">
        Already have an account? <a href="${url.loginUrl}">Sign in</a>
      </div>

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