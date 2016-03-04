start /b java.exe -jar D:\AppDev7\LocalWeb\ext\winstone-0.9.10.jar --webroot=D:\AppDev7\LocalWeb\web\ --logfile=D:\AppDev7\LocalWeb\log\winstone.log --httpPort=8090
start /b D:\AppDev7\LocalWeb\ext\paexec -s d:\Uniface9701\common\bin\urouter.exe /dbg /adm=d:\Uniface9701\common\adm /asn=D:\AppDev7\LocalWeb\asn\urouter2.asn  /dir=D:\AppDev7\LocalWeb\   tcp:localhost+13001
REM C:\Program Files (x86)\IBM\solidDB\solidDB6.5\bin\solid.exe -c<project_pathdbms  -n"dbms" -x hide
exit