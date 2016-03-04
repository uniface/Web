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