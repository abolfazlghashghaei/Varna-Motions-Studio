from pathlib import Path
import argparse,hashlib,subprocess,os,json
p=argparse.ArgumentParser();p.add_argument('--commit',required=True);p.add_argument('--archive',required=True);p.add_argument('--compiler',default='makensis');args=p.parse_args();root=Path(__file__).resolve().parent
if len(args.commit)!=40 or any(c not in '0123456789abcdef' for c in args.commit):raise SystemExit('Full commit required')
a=Path(args.archive);sha=hashlib.sha256(a.read_bytes()).hexdigest();url='https://github.com/abolfazlghashghaei/Varna-Motions-Studio/archive/'+args.commit+'.zip';meta={'url':url,'sha256':sha,'bytes':a.stat().st_size,'commit':args.commit};(root/'build').mkdir(exist_ok=True);(root/'release.nsh').write_text('!define ARCHIVE_URL "'+url+'"\n!define ARCHIVE_SHA256 "'+sha+'"\n!define ARCHIVE_BYTES "'+str(a.stat().st_size)+'"\n');subprocess.run([args.compiler,'-V2',str(root/'setup.nsi')],check=True);(root/'build/payload58.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
