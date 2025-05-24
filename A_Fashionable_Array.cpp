#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int MOD = 1000000009;

void solve() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    sort(arr.begin(), arr.end());
    int mn = INT_MAX;
    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            if(i > n - 1 - j) {
                continue;
            }
            if((arr[i] + arr[n - 1 - j]) % 2 == 0) {
                mn = min(mn, i + j);
                break;
            }
        }
    }
    cout << mn << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while(t--) {
        solve();
    }
    return 0;
}