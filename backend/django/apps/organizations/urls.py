from django.urls import path
from . import views

app_name = 'organizations'

urlpatterns = [
    path('', views.OrganizationListCreateView.as_view(), name='organization-list'),
    path('<uuid:pk>/', views.OrganizationDetailView.as_view(), name='organization-detail'),
    path('<uuid:pk>/website/', views.OrganizationWebsiteView.as_view(), name='organization-website'),
    path('<uuid:pk>/members/', views.OrganizationMemberListView.as_view(), name='organization-members'),
]
