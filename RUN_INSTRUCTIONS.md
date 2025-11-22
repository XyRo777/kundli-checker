---
description: How to run the project on Windows with script execution disabled
---

If you encounter the "running scripts is disabled on this system" error in PowerShell, you can use one of the following methods:

### Method 1: Use Command Prompt (cmd)
Run the command using `cmd` directly:
```powershell
cmd /c "npm run dev"
```

### Method 2: Temporarily Bypass Execution Policy
Run this command in your PowerShell terminal to allow scripts for the current session only:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then run:
```powershell
npm run dev
```

### Method 3: Use Command Prompt
Simply open a standard Command Prompt (cmd.exe) instead of PowerShell and run:
```cmd
npm run dev
```
