from django.test import TestCase

from apps.accounts.models import User


class UserRoleTests(TestCase):
    def make(self, role):
        return User.objects.create_user(f"{role}@example.com", "pw-12345678", first_name="T", last_name="U", role=role)

    def test_normal_user_has_no_admin_access(self):
        user = self.make("user")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.has_perm("races.change_race"))

    def test_admin_can_do_everything(self):
        admin = self.make("admin")
        self.assertTrue(admin.is_staff and admin.is_superuser)
        self.assertTrue(admin.has_perm("betting.delete_bet"))

    def test_steward_is_limited_to_race_data(self):
        steward = self.make("steward")
        self.assertTrue(steward.is_staff)
        self.assertTrue(steward.has_perm("races.change_race"))
        self.assertTrue(steward.has_perm("results.add_raceresult"))
        self.assertFalse(steward.has_perm("accounts.change_user"))
        self.assertFalse(steward.has_perm("betting.change_bet"))

    def test_inactive_admin_has_no_access(self):
        admin = self.make("admin")
        admin.is_active = False
        self.assertFalse(admin.has_perm("races.change_race"))
        self.assertFalse(admin.is_staff)
