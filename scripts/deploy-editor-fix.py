#!/usr/bin/env python3
"""
Deploy fixes to production server
"""
import subprocess
import sys

HOST = "root@188.95.113.225"
PASSWORD = "Kbmef9Pke9u36VHh"
REMOTE_PATH = "/var/www/propuesta"

files_to_deploy = [
    ("src/services/ProposalService.js", f"{REMOTE_PATH}/src/services/"),
    ("src/controllers/editorController.js", f"{REMOTE_PATH}/src/controllers/"),
    ("scripts/create-test-proposals.js", f"{REMOTE_PATH}/scripts/"),
]

print("🚀 Desplegando cambios al servidor de producción...\n")

for local_file, remote_dir in files_to_deploy:
    print(f"📦 Desplegando {local_file}...")
    cmd = f"sshpass -p '{PASSWORD}' scp -o StrictHostKeyChecking=no {local_file} {HOST}:{remote_dir}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Error desplegando {local_file}")
        print(result.stderr)
        sys.exit(1)
    else:
        print(f"✅ {local_file} desplegado")

print("\n🔄 Reiniciando aplicación...")
restart_cmd = f"sshpass -p '{PASSWORD}' ssh -o StrictHostKeyChecking=no {HOST} 'cd {REMOTE_PATH} && pm2 restart propuesta-app'"
result = subprocess.run(restart_cmd, shell=True, capture_output=True, text=True)

if result.returncode != 0:
    print("❌ Error reiniciando aplicación")
    print(result.stderr)
else:
    print("✅ Aplicación reiniciada")

print("\n✨ ¡Deployment completado!")
print("📍 Verifica: https://propuesta.micecatering.eu/dashboard")
print("📍 Prueba crear propuestas: ssh root@188.95.113.225 'cd /var/www/propuesta && node scripts/create-test-proposals.js'")
