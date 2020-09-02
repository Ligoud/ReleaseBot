FROM compulim/iisnode

ADD ecma.ps1 /pscripts

#Устанвливаю шоколадного
RUN powershell Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

#Устанвливаю гит
RUN powershell choco install git -y

#Клонирую рабочую директорию
RUN powershell git init; git clone -b test https://Ligoud:89272800248Egor@github.com/Ligoud/ReleaseBot.git C:\site

#Устанвливаю свежий нод. по дефолту стоит 8.1
RUN powershell choco install nodejs -y

#Устанвливаю letsencrypt. 
ADD https://github.com/win-acme/win-acme/releases/download/v2.1.8.1/win-acme.v2.1.8.847.x64.trimmed.zip letsencrypt.zip
RUN powershell Expand-Archive -Path letsencrypt.zip -DestinationPath c:\letsencrypt

#Устанвливаю SSH
ADD https://github.com/PowerShell/Win32-OpenSSH/releases/download/v8.1.0.0p1-Beta/OpenSSH-Win64.zip openssh.zip
RUN powershell Expand-Archive -Path openssh.zip -DestinationPath c:\openssh

#Хостую iis сервер
 RUN powershell -NoProfile -Command Import-module IISAdministration; Remove-Website 'Default Web Site' ;New-IISSite -Name 'ofmbot' -PhysicalPath C:\site -BindingInformation '*:80:'; 

EXPOSE 80
EXPOSE 443
