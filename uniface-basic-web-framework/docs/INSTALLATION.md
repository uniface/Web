<a name="Installation"></a>Installation
-----------------------------------
1. Create a new folder and checkout http://svn-uniface.uniface.m4.local:8080/svn/FTS/POC/WebFramework/trunk using TortoiseSVN.
2. Create a USYS96 system variable pointing to the Uniface installation you want to use (9.6.05 or up). In my case that would be C:\Program Files (x86)\Compuware\Uniface 9.6. Note the lack of quotes and the lack of a trailing slash. Alternatively just replace the %USYS96% string in all the shortcuts with the path to your Uniface installation.
3. Run the shortcut "UnifaceWeb - Setup" as administrator in your newly checked out project. This needs to run as administrator because it will be updating files like urouter.asn under your program files directory. The main thing to note is whatever you use for "project name" will be used in the URL for your project, so pick something that makes sense. It will default to the name of your project folder. Everything else should be picked up automatically from your usys.ini file, the only thing you might want to check is the userver user name and password.
4. Once the setup wizard has completed, restart your urouter.
5. Open a browser and point it at http://localhost:&lt;tomcat_port&gt;/&lt;project_name&gt;/. The values in angle brackets will be whatever you specified in the setup wizard, bearing in mind that &lt;project_name&gt; is case sensitive.
6. Login with the username "admin" and the password "password".


<a name="Project_Structure"></a>Project Structure
---------------------------------------------

* adm   - All ini files for the project including usys.ini and uweb.ini
* asn   - Assignment files
* bin   - Compiled Uniface objects
* conf  - Menu configuration
* dbms  - Application and source code SQLite databases
* docs  - Documentation folder
* dtd   - DTDs used by the framework
* ext   - External libraries like UnifaceSVN and the project setup wizard
* hts   - External html DSP layouts
* log   - All logs
* lst   - Source code listings
* setup - Files used by the setup wizard to configure the project
* sql   - Table definitions and pre-loaded application date
* src   - Source code exports
* web   - Web resources for the project including the generated dspjs files