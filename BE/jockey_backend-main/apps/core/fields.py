"""INT UNSIGNED / BIGINT UNSIGNED primary keys, to match the SQL schema.

On MariaDB a foreign key column must have exactly the same type as the column
it points to. The schema uses unsigned ids, so any table Django creates that
points at them (django_admin_log, authtoken_token) must be unsigned too.
On SQLite these behave like normal auto fields.
"""
from django.db import models


class UnsignedAutoField(models.AutoField):
    def db_type(self, connection):
        if connection.vendor == "mysql":
            return "integer UNSIGNED AUTO_INCREMENT"
        return super().db_type(connection)

    def rel_db_type(self, connection):
        if connection.vendor == "mysql":
            return "integer UNSIGNED"
        return super().rel_db_type(connection)


class UnsignedBigAutoField(models.BigAutoField):
    def db_type(self, connection):
        if connection.vendor == "mysql":
            return "bigint UNSIGNED AUTO_INCREMENT"
        return super().db_type(connection)

    def rel_db_type(self, connection):
        if connection.vendor == "mysql":
            return "bigint UNSIGNED"
        return super().rel_db_type(connection)
