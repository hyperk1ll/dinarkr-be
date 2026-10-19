import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.50.0.1', username='root', password='cabeijo21#', timeout=10)

cmd = sys.argv[1] if len(sys.argv) > 1 else 'echo OK'
stdin, stdout, stderr = client.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

if out:
    print(out)
if err:
    print('ERR:', err)

client.close()
