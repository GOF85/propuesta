#!/usr/bin/env python3
"""
Script: VPS CLI Helper para MICE Catering
Purpose: Conectar y ejecutar comandos en el VPS sin pedir contraseña
Usage: python scripts/vps-cli.py status
       python scripts/vps-cli.py logs [lines]
       python scripts/vps-cli.py restart
       python scripts/vps-cli.py npm install
"""

import subprocess
import sys
import os
from pathlib import Path

# Credenciales
VPS_USER = "root"
VPS_HOST = "188.95.113.225"
VPS_PASS = "Kbmef9Pke9u36VHh"
APP_PATH = "/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu"
NODE_BIN = "/opt/plesk/node/24/bin/node"

class VpsClient:
    def __init__(self):
        self.host = f"{VPS_USER}@{VPS_HOST}"
    
    def execute(self, command, silent=False):
        """Ejecutar comando en VPS via SSH"""
        try:
            # Usar sshpass con -e flag para leer contraseña de env var
            env = os.environ.copy()
            env['SSHPASS'] = VPS_PASS
            
            # Agregar verbosidad deshabilitada para SSH
            ssh_cmd = [
                'sshpass', '-e', 'ssh',
                '-o', 'StrictHostKeyChecking=no',
                '-o', 'UserKnownHostsFile=/dev/null',
                self.host,
                command
            ]
            
            if not silent:
                print(f"➜ Ejecutando: {command}")
            
            result = subprocess.run(
                ssh_cmd,
                env=env,
                capture_output=False,
                text=True
            )
            
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Error SSH: {e}")
            return False
    
    def pm2_status(self):
        """Ver estado PM2"""
        cmd = f"cd {APP_PATH} && {NODE_BIN} node_modules/.bin/pm2 status"
        self.execute(cmd)
    
    def pm2_logs(self, lines=50):
        """Ver logs PM2"""
        cmd = f"cd {APP_PATH} && {NODE_BIN} node_modules/.bin/pm2 logs mice-catering --lines {lines}"
        self.execute(cmd)
    
    def pm2_restart(self):
        """Reiniciar aplicación"""
        print("🔄 Reiniciando aplicación...")
        cmd = f"cd {APP_PATH} && {NODE_BIN} node_modules/.bin/pm2 restart mice-catering"
        self.execute(cmd)
    
    def npm_cmd(self, args):
        """Ejecutar comando npm"""
        npm_args = ' '.join(args)
        cmd = f"cd {APP_PATH} && npm {npm_args}"
        self.execute(cmd)
    
    def seed_data(self):
        """Ejecutar seed de datos"""
        print("🌱 Sembrando datos de prueba...")
        cmd = f"cd {APP_PATH} && npm run seed"
        self.execute(cmd)
    
    def check_port(self, port=3000):
        """Verificar si puerto está en escucha"""
        cmd = f"netstat -tulpn 2>/dev/null | grep ':{port}' || echo 'Puerto {port} no está en escucha'"
        self.execute(cmd)
    
    def db_connect(self):
        """Verificar conexión MariaDB"""
        cmd = f"mysql -h localhost -u catering_user -pARpjZ@3nwse90*zq catering_proposals -e 'SELECT COUNT(*) as total_usuarios FROM users;'"
        self.execute(cmd)

def main():
    client = VpsClient()
    
    if len(sys.argv) < 2:
        print("📍 MICE Catering VPS CLI Helper")
        print("\nComandos disponibles:")
        print("  status              → Ver estado PM2")
        print("  logs [N]            → Ver últimos N logs (default: 50)")
        print("  restart             → Reiniciar aplicación")
        print("  npm [args]          → Ejecutar npm (ej: npm install)")
        print("  seed                → Sembrar datos de prueba")
        print("  port [N]            → Verificar si puerto N está en escucha")
        print("  db                  → Verificar conexión MariaDB")
        print("  ssh [cmd]           → Ejecutar comando SSH directo")
        return
    
    command = sys.argv[1].lower()
    
    if command == "status":
        client.pm2_status()
    elif command == "logs":
        lines = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        client.pm2_logs(lines)
    elif command == "restart":
        client.pm2_restart()
    elif command == "npm":
        client.npm_cmd(sys.argv[2:])
    elif command == "seed":
        client.seed_data()
    elif command == "port":
        port = sys.argv[2] if len(sys.argv) > 2 else "3000"
        client.check_port(port)
    elif command == "db":
        client.db_connect()
    elif command == "ssh":
        cmd = ' '.join(sys.argv[2:])
        client.execute(cmd)
    else:
        print(f"❌ Comando desconocido: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
