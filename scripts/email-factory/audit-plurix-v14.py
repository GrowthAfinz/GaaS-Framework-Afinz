from pathlib import Path
import sys, subprocess
sql=Path('supabase/migrations/20261027161205_dynamic_email_plurix_v14_dark_mode.sql').read_text(encoding='utf8')
output=Path(sys.argv[1])/'plurix-v14.amp.html'
output.write_text(sql.split('$v14$')[1],encoding='utf8')
subprocess.run([sys.executable,sys.argv[2],str(output)],check=True)
