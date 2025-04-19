import sys
path = '/home/jeyheym/Leitura'
if path not in sys.path:
    sys.path.append(path)

from app import app as application