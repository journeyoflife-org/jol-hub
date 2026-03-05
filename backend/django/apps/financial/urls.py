from django.urls import path
from . import views

app_name = 'financial'

urlpatterns = [
    path('invoices/', views.InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<uuid:pk>/', views.InvoiceDetailView.as_view(), name='invoice-detail'),
    path('payouts/', views.PayoutListView.as_view(), name='payout-list'),
]
