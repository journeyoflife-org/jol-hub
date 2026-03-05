from django.urls import path
from . import views

app_name = 'donations'

urlpatterns = [
    path('', views.DonationListCreateView.as_view(), name='donation-list'),
    path('<uuid:pk>/', views.DonationDetailView.as_view(), name='donation-detail'),
    path('<uuid:pk>/refund/', views.DonationRefundView.as_view(), name='donation-refund'),
]
