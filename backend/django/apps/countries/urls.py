from django.urls import path
from . import views

app_name = 'countries'

urlpatterns = [
    path('', views.CountryListView.as_view(), name='country-list'),
    path('<str:code>/', views.CountryDetailView.as_view(), name='country-detail'),
]
