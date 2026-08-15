import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
const M={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2','.json':'application/json','.png':'image/png'}
const f=p=>existsSync(p)&&statSync(p).isFile()
createServer((q,s)=>{
  const u=decodeURIComponent((q.url??'/').split('?')[0])
  const p=[join('out',u),join('out',u+'.html'),join('out',u,'index.html')].find(f)
  if(!p){s.writeHead(404,{'content-type':'text/html; charset=utf-8'});s.end('<h1>404</h1>');return}
  s.writeHead(200,{'content-type':M[extname(p)]??'application/octet-stream'})
  s.end(readFileSync(p))
}).listen(4400,()=>console.log('http://localhost:4400'))
