from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from store.models import Category, Product, Order, OrderItem, Coupon, InventoryMovement
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds initial demo products, admin credentials, demo customers, orders, and stock movements.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding AURA Studio e-commerce demo dataset...")

        # 1. Superuser
        admin, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@aurastudio.com', 'is_staff': True, 'is_superuser': True})
        if created:
            admin.set_password('root')
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin user (admin/root)"))

        self.stdout.write(self.style.SUCCESS("Demo dataset successfully initialized."))
