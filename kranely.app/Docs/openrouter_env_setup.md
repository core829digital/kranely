OpenRouter API key global setup
--------------------------------

Goal
- Persist the OpenRouter API key across new sessions so commands like curl ... -H "Authorization: Bearer $OPENROUTER_API_KEY" continue to work without reconfiguring.

What to do
- Choose your platform and run the appropriate script below. The key can be provided directly or stored securely for reuse.

Windows (PowerShell)
- Run this once to create a per-user environment variable:
  - Open PowerShell and run:
    - pwsh: Set-ExecutionPolicy Bypass -Scope Process -Force; & '${PWD}\\scripts\\setup_openrouter_env.ps1' -Key YOUR_OPENROUTER_API_KEY
- This writes the key to the user registry and sets an environment variable OPENROUTER_API_KEY for the current user. It also caches the key at %USERPROFILE%\ .openrouter\OPENROUTER_API_KEY.txt for future runs.
- In a new session, the environment variable will be available automatically.

Windows alternative (setx)
- If you prefer, you can manually set the environment variable:
  - open a PowerShell window and run:
    - [Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "<YOUR_KEY>", "User")
  - Then start a new terminal; the key will be available as $env:OPENROUTER_API_KEY.

Linux/macOS (bash)
- Save the key to a file and run the setup script:
  - mkdir -p "$HOME/.openrouter"; echo "<YOUR_KEY>" > "$HOME/.openrouter/OPENROUTER_API_KEY.txt"
- Then run:
  - bash scripts/setup_openrouter_env.sh <YOUR_KEY>
- This will write the key to $HOME/.openrouter/OPENROUTER_API_KEY.txt and append the export OPENROUTER_API_KEY line to ~/.bashrc if not already present. Start a new shell to pick up the change.

Security notes
- Treat the API key as a secret. Do not commit the key to version control.
- When sharing instructions, redact the key. Use environment-based configuration rather than embedding the key in code.

Validation tips
- In a new session, run:
  - curl https://openrouter.ai/api/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    -d '{"model": "google/gemma-4-31b-it:free","messages": [{"role": "user", "content": "How many r`s are in the word `strawberry?`"}] ,"reasoning": {"enabled": true}}'
- If configured correctly, the request should be authenticated with your key.
