create table APP_FORUM_POST
(
 ID char(32) not null,
 USER_ID char(32) null,
 POST_DATE_TIME datetime null,
 POST_TEXT varchar(8106) null, 
 primary key  (ID)
);

create table OAPP_FORUM_POST
(
 ID char(32) not null,
 SEGM char(4) not null,
 DATA varchar(8154) null, 
 primary key  (ID,SEGM)
);

create table APP_LOGIN_ATTEMPT
(
 ID char(32) not null,
 IP_ADDRESS char(15) not null,
 FAILED_ATTEMPTS char(32) null,
 LAST_ATTEMPT datetime null, 
 primary key  (ID)
);

create unique index APP_LOGIN_ATTEMPT_IDX2 on 
APP_LOGIN_ATTEMPT(IP_ADDRESS);

create table APP_MENU_MAP
(
 ID char(32) not null,
 MENU_CD char(32) null,
 MENU_MODE char(32) null,
 DSP char(32) null, 
 primary key  (ID)
);

create table APP_USER
(
 ID char(32) not null,
 USERNAME char(32) not null,
 PASSWORD char(64) null,
 SALT char(32) null,
 REGISTERED datetime null,
 LAST_LOGIN datetime null,
 ATTEMPTS char(32) null, 
 primary key  (ID)
);

create unique index APP_USER_IDX2 on 
APP_USER(USERNAME);