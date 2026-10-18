from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts import selectors, services
from apps.accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    accept_terms = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "mobile_number", "password", "accept_terms"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Terms and Privacy Notice.")
        return value

    def validate(self, attrs):
        validate_password(attrs["password"])
        return attrs

    def create(self, validated):
        validated.pop("accept_terms")
        return services.register_user(**validated)


class ProfileSerializer(serializers.ModelSerializer):
    initials = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "mobile_number", "avatar_url", "initials", "role"]
        read_only_fields = ["id", "email", "role"]
